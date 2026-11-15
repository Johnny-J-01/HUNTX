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
import { loadVideoTranscript } from "../storage/video-files.js";
import {
	acquireFileLock,
	releaseFileLock,
	isFileLocked,
} from "../video/file-locks.js";
import { hasExpired } from "../storage/retention.js";
import {
	deleteFile,
	deleteExportWorkDir,
	getExportWorkDir,
	getExportProcessingLockKey,
	getExportDeleteLockKey,
} from "./export-files.js";
import {
	isPathInsideDir,
	buildExportFilename,
	prepareCaptionsFile,
} from "./export-preparation.js";
import { uploadExportToDrive } from "./export-storage.js";
import { MAX_CONCURRENT_EXPORTS, activeExportJobs } from "./export-job.js";

export async function processExportJob(exportId) {
	const processingLock = getExportProcessingLockKey(exportId);
	if (isFileLocked(getExportDeleteLockKey(exportId))) return;
	acquireFileLock(processingLock);
	const workDir = getExportWorkDir(exportId);
	let outputPath = null;
	let captionsSrtPath = null;
	let temporaryVideoPath = null;
	let normalizedVideoPath = null;
	let fallbackSourcePath = null;
	let encodingDecision = null;
	let metrics = null;
	let lockedSourcePath = null;
	let progressWrite = Promise.resolve();
	let renderingComplete = false;

	try {
		const exp = await store.getExport(exportId);

		if (!exp) {
			return;
		}

		if (["CLOSED", "EXPIRED"].includes(exp.status)) return;
		metrics = createExportMetrics(exp.createdAt);

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
		encodingDecision = null;
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
			if (video.filePath && fs.existsSync(video.filePath)) {
				sourcePath = video.filePath;
				lockedSourcePath = sourcePath;
				acquireFileLock(lockedSourcePath);
				console.log(`Using existing local video for export ${exportId}: ${sourcePath}`);
			} else if (video.driveFileId) {
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
					fallbackSourcePath = path.join(workDir, `${video.id}_source.mp4`);
					sourcePath = await retrieve(video.driveFileId, fallbackSourcePath);
					sourceAccess = "drive-local";
				}
			} else {
				throw new Error("Original uploaded video is not available in Google Drive.");
			}

			} finally {
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

		const willLikelyReencode = exp.cropMode !== "original" || !(
			sourceVideoStream.codec_name === "h264" &&
			sourceVideoStream.pix_fmt === "yuv420p"
		);
		let scaledWidth = exportWidth;
		let scaledHeight = exportHeight;

		const MAX_SHORTER_SIDE = 720;
		const shorterSide = Math.min(exportWidth, exportHeight);

		if (willLikelyReencode && shorterSide > MAX_SHORTER_SIDE) {
			const scaleFactor = MAX_SHORTER_SIDE / shorterSide;
			scaledWidth = Math.round(exportWidth * scaleFactor);
			scaledHeight = Math.round(exportHeight * scaleFactor);
			if (scaledWidth % 2 !== 0) scaledWidth += 1;
			if (scaledHeight % 2 !== 0) scaledHeight += 1;

			console.log(JSON.stringify({
				event: "export_scale_cap",
				exportId,
				originalW: exportWidth, originalH: exportHeight,
				scaledW: scaledWidth, scaledH: scaledHeight,
				reason: "shorter_side_exceeds_720p",
			}));
		}

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

		const memAfterFfmpeg = process.memoryUsage();
		console.log(JSON.stringify({
			event: "export_mem_after_ffmpeg",
			exportId,
			rssMB: (memAfterFfmpeg.rss / 1048576).toFixed(1),
			heapUsedMB: (memAfterFfmpeg.heapUsed / 1048576).toFixed(1),
			ffmpegMs: metrics.timings.ffmpegMs,
		}));

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

		const durationTolerance = Math.max(0.25, 3 / (Number(outputMetadata.frameRate) || 30));
		const durationDiff = Math.abs((Number(outputMetadata.duration) || 0) - clipDuration);

		const isVideoCodecValid = outputMetadata.videoCodec === "h264";
		const isDurationValid = (outputMetadata.duration > 0) && (durationDiff <= durationTolerance);
		const isAudioCodecValid = !streams.hasAudio || outputMetadata.audioCodec === "aac";
		const isDimensionsValid = exp.cropMode === "original" || (
			outputMetadata.width === scaledWidth && outputMetadata.height === scaledHeight
		);

		const isValid = isVideoCodecValid && isDurationValid && isAudioCodecValid && isDimensionsValid;

		if (!isValid) {
			const failedChecks = [];
			const details = {};

			if (!isVideoCodecValid) {
				failedChecks.push("videoCodec");
				details.videoCodec = {
					actual: outputMetadata.videoCodec,
					expected: "h264",
				};
			}

			if (!isDurationValid) {
				failedChecks.push("duration");
				details.duration = {
					actual: outputMetadata.duration,
					expected: clipDuration,
					difference: durationDiff,
					tolerance: durationTolerance,
				};
			}

			if (!isAudioCodecValid) {
				failedChecks.push("audioCodec");
				details.audioCodec = {
					actual: outputMetadata.audioCodec,
					expected: "aac",
				};
			}

			if (!isDimensionsValid) {
				failedChecks.push("dimensions");
				details.dimensions = {
					actual: { width: outputMetadata.width, height: outputMetadata.height },
					expected: { width: scaledWidth, height: scaledHeight },
				};
			}

			console.log(JSON.stringify({
				event: "export_validation_failed",
				exportId,
				cropMode: exp.cropMode,
				failedChecks,
				details,
			}));

			throw new Error("The completed export failed duration, codec or dimension validation.");
		}

		const latestExport = await store.getExport(exportId);

		if (!latestExport || ["CLOSED", "EXPIRED"].includes(latestExport.status)) {
			deleteExportWorkDir(exportId);
			return;
		}

		const localReadyAt = Date.now();

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
			// update: re-encodes now run with -threads 1 to cap memory on Render.
			encoderThreads: encodingDecision?.copyVideo ? 0 : 1,
			concurrentFfmpegJobs: Math.max(0, ...metrics.resources.map(
				(value) => Number(value.concurrentFfmpegJobsAtStart) || 0,
			)),
			concurrentExportJobs: activeExportJobs,
			concurrencyLimit: MAX_CONCURRENT_EXPORTS,
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
			width: scaledWidth,
			height: scaledHeight,
			metrics: measuredMetrics,
		}, { allowedStatuses: ["PROCESSING"] });
		if (!ready) return;
		measuredMetrics.totalExportMs = Date.now() - Number(exp.createdAt ?? Date.now());
		await store.patchExport(exportId, { metrics: measuredMetrics }).catch((error) => {
			console.warn(`Could not persist export readiness timing: ${safeExportError(error)}`);
		});

		void uploadExportToDrive(exportId, video);

		if (temporaryVideoPath && isPathInsideDir(temporaryVideoPath, workDir)) deleteFile(temporaryVideoPath);
		if (normalizedVideoPath && isPathInsideDir(normalizedVideoPath, workDir)) deleteFile(normalizedVideoPath);
		if (fallbackSourcePath && isPathInsideDir(fallbackSourcePath, workDir)) deleteFile(fallbackSourcePath);

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
				const isMemoryError =
					/killed|sigkill|out of memory|enomem|cannot allocate memory/i.test(rawError);
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
		const safeDeleteInWorkDir = (filePath) => {
			if (!filePath) return;
			try {
				if (isPathInsideDir(filePath, workDir)) {
					deleteFile(filePath);
				}
			} catch (deleteError) {
				console.warn(`Failed to clean up temporary file ${filePath}:`, safeExportError(deleteError));
			}
		};

		safeDeleteInWorkDir(temporaryVideoPath);
		safeDeleteInWorkDir(normalizedVideoPath);
		safeDeleteInWorkDir(fallbackSourcePath);

		try {
			if (lockedSourcePath) releaseFileLock(lockedSourcePath);
		} catch (lockError) {
			console.warn(`Failed to release source file lock for ${exportId}:`, safeExportError(lockError));
		}

		try {
			releaseFileLock(processingLock);
		} catch (lockError) {
			console.warn(`Failed to release processing lock for ${exportId}:`, safeExportError(lockError));
		}

		try {
			const exp = await store.getExport(exportId).catch(() => null);
			if (exp && ["ERROR", "EXPIRED", "CLOSED"].includes(exp.status)) {
				deleteExportWorkDir(exportId);
			}
		} catch (cleanupError) {
			console.warn(`Failed to clean up workdir for ${exportId}:`, safeExportError(cleanupError));
		}
	}
}