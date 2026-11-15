import * as videos from "../../db/videos.js";
import * as store from "../../db/exports.js";
import fs from "fs";
import { safeExportError } from "./metrics.js";
import { storeExportVideo } from "../storage/video-files.js";
import {
	acquireFileLock,
	releaseFileLock,
	isFileLocked,
} from "../video/file-locks.js";
import { exportExpiresAt } from "../video/limits.js";
import { hasExpired } from "../storage/retention.js";
import {
	getExportUploadLockKey,
	getExportDeleteLockKey,
} from "./export-files.js";

const pendingDriveConfirmations = new Set();

export async function markExportError(exportId, message) {
	await store.patchExport(exportId, {
		status: "ERROR",
		progress: 0,
		error: message,
	});
}

export async function uploadExportToDrive(exportId, sourceVideo = null) {
	const uploadLockKey = getExportUploadLockKey(exportId);
	if (isFileLocked(uploadLockKey) || isFileLocked(getExportDeleteLockKey(exportId))) return;
	acquireFileLock(uploadLockKey);
	const uploadStartedAt = Date.now();
	let confirmed = pendingDriveConfirmations.has(exportId);

	try {
		const exp = await store.getExport(exportId);
		if (!exp || ["CLOSED", "EXPIRED"].includes(exp.status)) {
			pendingDriveConfirmations.delete(exportId);
			return;
		}
		if (hasExpired(exp.expiresAt)) {
			await store.patchExport(exportId, { status: "EXPIRED" });
			pendingDriveConfirmations.delete(exportId);
			return;
		}
		let driveFileId = exp.driveFileId || null;
		let uploadedAt = exp.driveUploadedAt;
		if (!driveFileId) {
			const video = sourceVideo || await videos.getVideo(exp.videoId);
			if (!video) throw new Error("Source video no longer exists.");
			if (!exp.outputPath || !fs.existsSync(exp.outputPath)) {
				throw new Error("The local export is no longer available for Drive upload.");
			}
			await store.patchExport(exportId, { storageStatus: "UPLOADING", storageError: null });
			const driveFile = await storeExportVideo(video, exp, exp.outputPath);
			driveFileId = driveFile.id;
			if (!driveFileId) throw new Error("Google Drive did not confirm an export file ID.");
			uploadedAt = Date.now();
		}
		confirmed = true;
		uploadedAt ??= Date.now();
		const confirmation = {
			driveFileId, driveUploadedAt: uploadedAt,
			expiresAt: exp.expiresAt ?? exportExpiresAt(uploadedAt),
			metrics: { ...(exp.metrics || {}),
				driveUploadMs: exp.driveUploadedAt != null
					? exp.metrics?.driveUploadMs ?? 0 : uploadedAt - uploadStartedAt,
				driveUploadOutcome: "confirmed" },
		};
		store.rememberExportDriveConfirmation(exportId, confirmation);
		pendingDriveConfirmations.add(exportId);
		let finalizationError;
		for (let attempt = 0; attempt < 3; attempt += 1) {
			try {
				const latest = await store.getExport(exportId);
				if (!latest) { pendingDriveConfirmations.delete(exportId); return; }
				const saved = await store.patchExport(exportId, {
					...confirmation, storageStatus: "STORED", storageError: null,
					metrics: { ...(latest.metrics || {}), ...confirmation.metrics },
				});
				if (!saved) { pendingDriveConfirmations.delete(exportId); return; }
				pendingDriveConfirmations.delete(exportId);
				console.log(JSON.stringify({ event: "export_drive_stored", exportId,
					driveUploadedAt: uploadedAt, expiresAt: confirmation.expiresAt,
					metrics: saved.metrics }));
				const memAfterDrive = process.memoryUsage();
				console.log(JSON.stringify({
					event: "export_mem_after_drive",
					exportId,
					rssMB: (memAfterDrive.rss / 1048576).toFixed(1),
					heapUsedMB: (memAfterDrive.heapUsed / 1048576).toFixed(1),
				}));
				return;
			} catch (error) { finalizationError = error; }
		}
		throw finalizationError;
	} catch (error) {
		console.error(`Drive ${confirmed ? "confirmation" : "upload"} for export ${exportId} failed:`, safeExportError(error));
		try {
			const exp = await store.getExport(exportId);
			if (exp) await store.patchExport(exportId, {
				storageStatus: confirmed ? "FINALIZING" : "FAILED",
				storageError: safeExportError(error),
				metrics: { ...(exp.metrics || {}),
					...(confirmed ? {} : { driveUploadMs: Date.now() - uploadStartedAt }),
					driveUploadOutcome: confirmed ? "confirmation_pending" : "failed" },
			});
		} catch (statusError) {
			console.error(`Failed to record Drive state for export ${exportId}:`, safeExportError(statusError));
		}
	} finally { releaseFileLock(uploadLockKey); }
}

export async function retryPendingDriveConfirmations() {
	for (const exportId of pendingDriveConfirmations) await uploadExportToDrive(exportId);
}