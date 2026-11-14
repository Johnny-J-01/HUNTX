import { createHash } from "crypto";
import { performance } from "node:perf_hooks";
import { createExportMetrics, safeExportError } from "./metrics.js";
import fs from "fs";
import path from "path";

import * as videos from "../../db/videos.js";
import * as store from "../../db/exports.js";
import ytdlp from "../ytdlp/client.js";
import ffmpegSvc from "../ffmpeg/config.js";
import { getAuthenticatedClient } from "../google/auth.js";
import { downloadFileToPath } from "../google/drive.js";
import {
	loadVideoTranscript,
	storeExportVideo,
} from "../storage/video-files.js";
import {
	acquireFileLock,
	releaseFileLock,
	isFileLocked,
} from "../video/file-locks.js";
import { exportExpiresAt } from "../video/limits.js";
import { hasExpired } from "../storage/retention.js";
import { DIRS as VIDEO_DIRS } from "../video/paths.js";
import {
	deleteFile,
	deleteExportWorkDir,
	getExportWorkDir,
	getExportUploadLockKey,
	getExportProcessingLockKey,
	getExportDeleteLockKey,
} from "./export-files.js";

const EXPORT_CONCURRENCY = Math.min(
	4,
	Math.max(1, Number.parseInt(process.env.EXPORT_CONCURRENCY || "2", 10) || 2),
);
const exportQueue = [];
const pendingExportJobs = new Map();
let activeExportJobs = 0;
const captionPreparations = new Map();
const pendingDriveConfirmations = new Set();

export function getExportJobStats() {
	return {
		active: activeExportJobs,
		queued: exportQueue.length,
		limit: EXPORT_CONCURRENCY,
	};
}

function sanitizeFilename(filename) {
	return (
		String(filename || "clip")
			.replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.replace(/\.+$/, "")
			.slice(0, 120) || "clip"
	);
}

export function buildExportFilename(filenameBase, width, height) {
	return `${sanitizeFilename(filenameBase)}_${width}x${height}.mp4`;
}

function captionsForRange(transcript, start, end) {
	if (!Array.isArray(transcript)) return [];
	return transcript.filter((segment) => {
		const text = String(segment?.text || "").trim();
		return (
			text &&
			Number(segment?.end) > Number(start) &&
			Number(segment?.start) < Number(end)
		);
	});
}

async function prepareCaptionsFile(video, transcript, start, end, exportId) {
	if (captionsForRange(transcript, start, end).length === 0) return null;

	const hash = createHash("sha256")
		.update(JSON.stringify({ version: 1, videoId: video.id, transcript, start, end }))
		.digest("hex")
		.slice(0, 20);
	const cachePath = path.join(
		VIDEO_DIRS.transcripts,
		`${video.id}-captions-${hash}.srt`,
	);
	if (captionPreparations.has(cachePath)) return captionPreparations.get(cachePath);

	const preparation = Promise.resolve().then(() => {
		if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) return cachePath;
		fs.mkdirSync(path.dirname(cachePath), { recursive: true });
		const temporaryPath = `${cachePath}.${process.pid}.${exportId}.tmp`;
		try {
			ffmpegSvc.buildSrtForRange(transcript, start, end, temporaryPath);
			if (fs.statSync(temporaryPath).size === 0) {
				deleteFile(temporaryPath);
				return null;
			}
			fs.renameSync(temporaryPath, cachePath);
			return cachePath;
		} catch (error) {
			deleteFile(temporaryPath);
			throw error;
		}
	}).finally(() => captionPreparations.delete(cachePath));

	captionPreparations.set(cachePath, preparation);
	return preparation;
}

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

		// Retrying metadata must never repeat the completed media upload or reset TTL.
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
				// --- Memory checkpoint 3: after Drive upload finishes ---
				// Captured right after the Google Drive upload stream finishes and the
				// file is confirmed stored in Drive. Comparing this to checkpoint 2
				// measures memory overhead from Drive streaming and network operations.
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

async function processExportJob(exportId) {
	const processingLock = getExportProcessingLockKey(exportId);
	if (isFileLocked(getExportDeleteLockKey(exportId))) return;
	acquireFileLock(processingLock);
	let outputPath = null;
	let captionsSrtPath = null;
	let temporaryVideoPath = null;
	let normalizedVideoPath = null;
	let fallbackSourcePath = null;
	let metrics = null;
	let lockedSourcePath = null;
	let progressWrite = Promise.resolve();
	let renderingComplete = false;

	try {
		const workDir = getExportWorkDir(exportId);
		const exp = await store.getExport(exportId);

		if (!exp) {
			return;
		}

		if (["CLOSED", "EXPIRED"].includes(exp.status)) return;
		metrics = createExportMetrics(exp.createdAt);

		// --- Memory checkpoint 1: before the export starts ---
		// We log RSS (Resident Set Size) which is the total physical memory the
		// Node process is using right now, including the V8 heap, native buffers,
		// and shared libraries. On a 512 MB Render instance this tells us how much
		// headroom is left before ffmpeg starts.
		const memBefore = process.memoryUsage();
		console.log(JSON.stringify({
			event: "export_mem_before",
			exportId,
			rssMB: (memBefore.rss / 1048576).toFixed(1),
			heapUsedMB: (memBefore.heapUsed / 1048576).toFixed(1),
		}));

		const video = await videos.getVideo(exp.videoId);

		if (!video || video.status !== "READY" || hasExpired(video.expiresAt)) {
			throw new Error("Source video is no longer available for export.");
		}

		const isYouTube =
			video.sourceType === "youtube" &&
			typeof video.sourceUrl === "string" &&
			video.sourceUrl.length > 0;

		const clipDuration = Math.max(
			0.1,
			Number(exp.end) - Number(exp.start),
		);

		const processing = await store.patchExport(exportId, {
			status: "PROCESSING", progress: 5, error: null,
		}, { allowedStatuses: ["QUEUED", "PROCESSING"] });
		if (!processing) return;

		let sourcePath = null;
		let inputOptions = [];
		let streams = null;
		let sourceAccess = "local";
		let encodingDecision = null;
		let exportStart = exp.start;
		let exportEnd = exp.end;
		const probeSource = (source, options = []) => metrics.measure(
			"ffprobeMs", () => ffmpegSvc.probeStreams(source, options),
		);
		const retrieve = (fileId, destination) => metrics.measure(
			"sourceRetrievalMs", () => downloadFileToPath(fileId, destination),
		);
		const retrievalStartedAt = performance.now();

		if (video.sourceType === "upload") {
			try {
			// Check if local file still exists
			if (video.filePath && fs.existsSync(video.filePath)) {
				sourcePath = video.filePath;
				lockedSourcePath = sourcePath;
				acquireFileLock(lockedSourcePath);
				console.log(`Using existing local video for export ${exportId}: ${sourcePath}`);
			} else if (video.driveFileId) {
				// Try remote Google Drive reading first
				try {
					const authClient = getAuthenticatedClient();
					const tokenResponse = await authClient?.getAccessToken?.();
					const token = tokenResponse?.token;

					if (token) {
						const remoteUrl = `https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media`;
						const remoteOptions = [
							"-headers",
							`Authorization: Bearer ${token}\r\n`,
							"-seekable",
							"1",
						];

						// Probe once and reuse the result for copy decisions and telemetry.
						streams = await probeSource(remoteUrl, remoteOptions);
						sourcePath = remoteUrl;
						inputOptions = remoteOptions;
						sourceAccess = "drive-remote";
						console.log(`Using remote Google Drive input for export ${exportId}`);
					} else {
						throw new Error("Google Drive access token unavailable.");
					}
				} catch (remoteError) {
					console.warn(
						`Direct remote Google Drive reading failed for export ${exportId}; falling back to scoped local download:`,
						safeExportError(remoteError),
					);
					// Fallback: download original video into this export's isolated workDir ONLY
					fallbackSourcePath = path.join(workDir, `${video.id}_source.mp4`);
					sourcePath = await retrieve(video.driveFileId, fallbackSourcePath);
					sourceAccess = "drive-local";
				}
			} else {
				throw new Error("Original uploaded video is not available in Google Drive.");
			}

			} finally {
				// Include failed acquisition attempts, but not nested probe time.
				metrics.timings.sourceRetrievalMs = Math.max(
					0, performance.now() - retrievalStartedAt - metrics.timings.ffprobeMs,
				);
			}
			await store.patchExport(exportId, {
				progress: 10,
			});
		} else if (isYouTube) {
			const temporaryId = `${video.id}-export-${exportId}`;

			await store.patchExport(exportId, {
				progress: 8,
			});

			const result = await metrics.measure("sourceRetrievalMs", () => ytdlp.downloadYouTubeVideoSection(
				video.sourceUrl,
				workDir,
				temporaryId,
				exp.start,
				exp.end,
				(progress) => {
					if (renderingComplete) return;
					progressWrite = progressWrite.then(() => store.patchExport(exportId, {
						progress: Math.min(40, 8 + Math.round(progress * 0.32)),
					}, { allowedStatuses: ["PROCESSING"] })).catch(() => {});
				},
			));
			temporaryVideoPath = result.filePath;

			if (
				!temporaryVideoPath ||
				!fs.existsSync(temporaryVideoPath)
			) {
				throw new Error(
					"YouTube section download finished but the video file was not found.",
				);
			}

			normalizedVideoPath = path.join(
				workDir,
				`${temporaryId}-normalized.mp4`,
			);

			await store.patchExport(exportId, {
				progress: 42,
			});

			await metrics.measure("ffmpegMs", () => ffmpegSvc.normalizeVideoSection(
				temporaryVideoPath,
				normalizedVideoPath,
				clipDuration,
				(observation) => metrics.resources.push(observation),
			));

			if (!fs.existsSync(normalizedVideoPath)) {
				throw new Error(
					"FFmpeg normalization finished but the normalized video file was not created.",
				);
			}

			sourcePath = normalizedVideoPath;
			sourceAccess = "youtube-local";
			exportStart = 0;
			exportEnd = clipDuration;

			await store.patchExport(exportId, {
				progress: 50,
			});
		} else {
			throw new Error("Unsupported video source type.");
		}

		const isRemoteSource = typeof sourcePath === "string" && /^https?:\/\//i.test(sourcePath);
		if (!sourcePath || (!isRemoteSource && !fs.existsSync(sourcePath))) {
			throw new Error("Export source video is not available.");
		}

		streams = streams || await probeSource(sourcePath, inputOptions);

		if (!streams.hasVideo) {
			throw new Error(
				"The source file does not contain a video stream.",
			);
		}

		if (exp.captions === "burn") {
			captionsSrtPath = await metrics.measure("captionPreparationMs", async () => {
				const transcript = await loadVideoTranscript(video);
				return prepareCaptionsFile(video, transcript, exp.start, exp.end, exportId);
			});
		}

		const sourceVideoStream = streams.videoStreams[0];
		const exportWidth = exp.cropMode === "original"
			? Number(sourceVideoStream.width)
			: exp.width;
		const exportHeight = exp.cropMode === "original"
			? Number(sourceVideoStream.height)
			: exp.height;
		if (!(exportWidth > 0) || !(exportHeight > 0)) {
			throw new Error("The source video dimensions could not be determined.");
		}

		// --- Step 4: 720p scale cap for re-encoded clips ---
		// If the source is taller than 720 pixels we scale the re-encoded clip
		// down to a maximum of 720 pixels in height while keeping the original
		// aspect ratio. This saves a lot of encoding memory and time because x264
		// allocates frame buffers proportional to width × height.
		//
		// Rules:
		//  • Stream-copy (cropMode=original, H.264 source): no scaling, -c copy is
		//    used and that path never touches pixel data.
		//  • Re-encode with user-chosen dimensions: the user's dimensions are
		//    respected UNLESS they exceed 720 px in height; then we cap to 720.
		//  • We only scale DOWN, never up.
		//
		// Note: `exportWidth`/`exportHeight` are the values ffmpeg will target.
		// We may reduce them here; the filename is then built with the capped size
		// so the user can see the actual output dimensions.
		const MAX_ENCODE_HEIGHT = 720;
		const sourceH = Number(sourceVideoStream.height) || 0;
		// Stream-copy does not re-encode, so scaling has no effect there.
		// We detect "will likely stream-copy" by checking cropMode=original here;
		// the actual decision is made inside exportClip. If stream-copy is chosen
		// the width/height we pass in are ignored, so it is safe to pass the
		// (possibly capped) values regardless.
		const willLikelyReencode = exp.cropMode !== "original" || !(
			sourceVideoStream.codec_name === "h264" &&
			sourceVideoStream.pix_fmt === "yuv420p"
		);
		let scaledWidth = exportWidth;
		let scaledHeight = exportHeight;
		if (willLikelyReencode && sourceH > MAX_ENCODE_HEIGHT && exportHeight > MAX_ENCODE_HEIGHT) {
			// Cap height to 720 and derive width from the original aspect ratio,
			// then round up to an even number (yuv420p requires even dimensions).
			scaledHeight = MAX_ENCODE_HEIGHT;
			scaledWidth = Math.round((exportWidth / exportHeight) * MAX_ENCODE_HEIGHT);
			if (scaledWidth % 2 !== 0) scaledWidth += 1;
			console.log(JSON.stringify({
				event: "export_scale_cap",
				exportId,
				originalW: exportWidth, originalH: exportHeight,
				scaledW: scaledWidth, scaledH: scaledHeight,
				sourceH, reason: "source_exceeds_720p",
			}));
		}

		// --- Step 8: pre-encode source info log ---
		// Log the source resolution, size, and the encoding decision so we can
		// diagnose memory problems without adding UI warnings yet.
		{
			const sourceStreamMeta = streams.metadata || {};
			console.log(JSON.stringify({
				event: "export_pre_encode",
				exportId,
				cropMode: exp.cropMode,
				quality: exp.quality,
				sourceW: sourceVideoStream.width,
				sourceH: sourceVideoStream.height,
				sourceDurationS: sourceStreamMeta.duration,
				sourceBitrate: sourceStreamMeta.bitrate,
				exportW: scaledWidth,
				exportH: scaledHeight,
				scaleCapped: scaledHeight !== exportHeight,
			}));
		}

		const filename = buildExportFilename(
			exp.filenameBase || video.title || "clip",
			scaledWidth,
			scaledHeight,
		);

		outputPath = path.join(
			workDir,
			`${exportId}_${filename}`,
		);

		const sourceMetadata = streams.metadata || {};
		let lastProgressWriteAt = 0;
		const encode = async () => {
			const probesBefore = metrics.timings.ffprobeMs;
			try {
				return await metrics.measure("ffmpegMs", () => ffmpegSvc.exportClip({
			sourcePath,
			outputPath,
			start: exportStart,
			end: exportEnd,
			// Use scaledWidth/scaledHeight (may be capped to 720p for re-encodes
			// of tall sources). For stream-copy these values are passed through
			// but ignored because -c copy bypasses all pixel processing.
			width: scaledWidth,
			height: scaledHeight,
			quality: exp.quality,
			cropMode: exp.cropMode || "fill",
			captionsSrtPath,
			inputOptions,
			sourceStreams: streams,
			onDecision: (decision) => { encodingDecision = decision; },
			measureProbe: (work) => metrics.measure("ffprobeMs", work),
			onResources: (observation) => metrics.resources.push(observation),
			onProgress: (progress) => {
				if (renderingComplete || Date.now() - lastProgressWriteAt < 750) return;
				lastProgressWriteAt = Date.now();
				const mappedProgress = isYouTube
					? 50 + Math.round(progress * 0.5)
					: 10 + Math.round(progress * 0.9);
				progressWrite = progressWrite.then(() => store.patchExport(exportId, {
					progress: Math.min(99, mappedProgress),
				}, { allowedStatuses: ["PROCESSING"] })).catch(() => {});
			},
		}));
			} finally {
				metrics.timings.ffmpegMs = Math.max(0,
					metrics.timings.ffmpegMs - (metrics.timings.ffprobeMs - probesBefore),
				);
			}
		};

		if (captionsSrtPath) acquireFileLock(captionsSrtPath);
		try {
			try {
				await encode();
			} catch (error) {
				if (!isRemoteSource) throw error;
				console.warn(`Remote FFmpeg processing failed for export ${exportId}; retrying from a local download.`);
				fallbackSourcePath = path.join(workDir, `${video.id}_source.mp4`);
				sourcePath = await retrieve(video.driveFileId, fallbackSourcePath);
				inputOptions = [];
				sourceAccess = "drive-local";
				streams = await probeSource(sourcePath);
				deleteFile(outputPath);
				await encode();
			}
		} finally {
			if (captionsSrtPath) releaseFileLock(captionsSrtPath);
		}

		renderingComplete = true;
		await progressWrite;
		const preparationStartedAt = performance.now();
		const probesBeforePreparation = metrics.timings.ffprobeMs;
		if (!fs.existsSync(outputPath)) {
			throw new Error("FFmpeg finished but the exported video file was not created.");
		}
		const outputStats = fs.statSync(outputPath);
		if (outputStats.size <= 0) throw new Error("The exported video file is empty.");
		const outputMetadata = await metrics.measure("ffprobeMs",
			() => ffmpegSvc.probeMetadata(outputPath),
		);
		const durationTolerance = Math.max(0.1, 2 / (Number(outputMetadata.frameRate) || 30));
		if (outputMetadata.videoCodec !== "h264" || !(outputMetadata.duration > 0)
			|| Math.abs(outputMetadata.duration - clipDuration) > durationTolerance
			|| (streams.hasAudio && outputMetadata.audioCodec !== "aac")
			// Validate against scaledWidth/scaledHeight (the dimensions we actually
			// asked ffmpeg to produce), not the original exportWidth/exportHeight which
			// may have been capped by the 720p scale rule above.
			|| (exp.cropMode !== "original" && (outputMetadata.width !== scaledWidth
				|| outputMetadata.height !== scaledHeight))) {
			throw new Error("The completed export failed duration, codec or dimension validation.");
		}

		const latestExport = await store.getExport(exportId);

		if (!latestExport || ["CLOSED", "EXPIRED"].includes(latestExport.status)) {
			deleteExportWorkDir(exportId);
			return;
		}

		const localReadyAt = Date.now();

		// --- Memory checkpoint 2: after ffmpeg finishes ---
		// Captured right after the encode() promise resolves. At this point the
		// ffmpeg child process has exited, so RSS should be falling (V8 GC hasn't
		// necessarily collected yet, but the native ffmpeg buffers are gone).
		const memAfterFfmpeg = process.memoryUsage();
		console.log(JSON.stringify({
			event: "export_mem_after_ffmpeg",
			exportId,
			rssMB: (memAfterFfmpeg.rss / 1048576).toFixed(1),
			heapUsedMB: (memAfterFfmpeg.heapUsed / 1048576).toFixed(1),
			ffmpegMs: metrics.timings.ffmpegMs,
		}));

		metrics.timings.localOutputPreparationMs = Math.max(0,
			performance.now() - preparationStartedAt -
			(metrics.timings.ffprobeMs - probesBeforePreparation),
		);
		metrics.timings.totalExportMs = localReadyAt - Number(exp.createdAt || localReadyAt);
		const qualitySettings = ffmpegSvc.QUALITY_PRESETS[exp.quality] || ffmpegSvc.QUALITY_PRESETS.high;
		const measuredMetrics = metrics.snapshot({
			source: { ...sourceMetadata, duration: Number(video.duration) || sourceMetadata.duration },
			output: outputMetadata,
			outputBytes: outputStats.size,
			sourceAccess,
			encoding: encodingDecision,
			preset: encodingDecision?.copyVideo ? null : qualitySettings.preset,
			crf: encodingDecision?.copyVideo ? null : qualitySettings.crf,
			cropMode: exp.cropMode,
			quality: exp.quality,
			captions: exp.captions,
			captionsRendered: Boolean(captionsSrtPath),
			clipStart: exp.start,
			clipEnd: exp.end,
			formatPreset: exp.cropMode === "original" ? "original" : exp.formatPreset,
			// Updated: re-encodes now run with -threads 1 to cap memory on Render.
			// Stream-copy uses no encoder threads.
			encoderThreads: encodingDecision?.copyVideo ? 0 : 1,
			concurrentFfmpegJobs: Math.max(0, ...metrics.resources.map(
				(value) => Number(value.concurrentFfmpegJobsAtStart) || 0,
			)),
			concurrentExportJobs: activeExportJobs,
			concurrencyLimit: EXPORT_CONCURRENCY,
		});
		const ready = await store.patchExport(exportId, {
			status: "READY",
			progress: 100,
			storageStatus: "UPLOADING",
			storageError: null,
			localReadyAt,
			outputPath,
			filename,
			error: null,
			// Store the actual output dimensions (after the 720p scale cap).
			width: scaledWidth,
			height: scaledHeight,
			metrics: measuredMetrics,
		}, { allowedStatuses: ["PROCESSING"] });
		if (!ready) return;
		measuredMetrics.totalExportMs = Date.now() - Number(exp.createdAt ?? Date.now());
		// READY is already published; telemetry failure cannot invalidate the file.
		await store.patchExport(exportId, { metrics: measuredMetrics }).catch((error) => {
			console.warn(`Could not persist export readiness timing: ${safeExportError(error)}`);
		});

		void uploadExportToDrive(exportId, video);

		deleteFile(temporaryVideoPath);
		deleteFile(normalizedVideoPath);
		deleteFile(fallbackSourcePath);

		console.log(JSON.stringify({ event: "export_local_ready", exportId, metrics: measuredMetrics }));
	} catch (error) {
		renderingComplete = true;
		await progressWrite;
		const rawError = safeExportError(error);
		console.error(`Export ${exportId} failed:`, rawError);

		deleteExportWorkDir(exportId);

		try {
			const currentExport = await store.getExport(exportId);

			if (currentExport && !["CLOSED", "EXPIRED"].includes(currentExport.status)) {
				// Detect memory exhaustion errors (OOM killer SIGKILL, ENOMEM, cannot allocate)
				const isMemoryError =
					/killed|sigkill|out of memory|enomem|cannot allocate memory/i.test(rawError);
				// Friendly user-facing message for memory limit failures
				const userMessage = isMemoryError
					? "Export failed due to server memory limits on the free tier. Try choosing the fast stream-copy option (Original mode) or download the original video instead."
					: rawError;

				await store.patchExport(exportId, {
					status: "ERROR",
					progress: 0,
					error: userMessage,
					metrics: metrics?.snapshot({ outcome: "failed" }) || {},
				}, { allowedStatuses: ["QUEUED", "PROCESSING"] });
			}
		} catch (statusError) {
			console.error(
				`Failed to update export ${exportId} after error:`,
				safeExportError(statusError),
			);
		}
	} finally {
		// Clean up files created or downloaded strictly for this export job.
		// These paths are located inside this export's isolated workDir, so deleting
		// them will never touch other exports or videos.
		deleteFile(temporaryVideoPath);
		deleteFile(normalizedVideoPath);
		deleteFile(fallbackSourcePath);
		if (lockedSourcePath) releaseFileLock(lockedSourcePath);
		releaseFileLock(processingLock);
		const exp = await store.getExport(exportId).catch(() => null);
		if (exp && ["ERROR", "EXPIRED", "CLOSED"].includes(exp.status)) deleteExportWorkDir(exportId);
	}
}

function drainExportQueue() {
	while (activeExportJobs < EXPORT_CONCURRENCY && exportQueue.length > 0) {
		const next = exportQueue.shift();
		activeExportJobs += 1;

		void processExportJob(next.exportId)
			.catch((error) => {
				console.error(`Unexpected export queue failure for ${next.exportId}:`, error);
			})
			.finally(() => {
				activeExportJobs -= 1;
				pendingExportJobs.delete(next.exportId);
				next.resolve();
				drainExportQueue();
			});
	}
}

export function runExportJob(exportId) {
	if (pendingExportJobs.has(exportId)) return pendingExportJobs.get(exportId);

	const promise = new Promise((resolve) => {
		exportQueue.push({ exportId, resolve });
	});
	pendingExportJobs.set(exportId, promise);
	drainExportQueue();
	return promise;
}
