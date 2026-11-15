import ffmpeg from "./instance.js";
import fs from "fs";
import path from "path";
import { buildCaptionFilter, buildFillFilter } from "./filters.js";
import { probeDuration } from "./probe.js";
import { getStreamCopyPlan } from "./stream-copy.js";
import { createResourceMonitor } from "./resources.js";
import { redactSecrets } from "../export/metrics.js";

let activeFfmpegJobs = 0;

export async function normalizeVideoSection(inputPath, outputPath, duration, onResources) {
	if (!fs.existsSync(inputPath)) {
		throw new Error("Cannot normalize video section because the source file does not exist.");
	}
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	const command = ffmpeg(inputPath)
		.videoFilters("setpts=PTS-STARTPTS")
		.audioFilters("asetpts=PTS-STARTPTS")
		.setDuration(Math.max(0.1, Number(duration) || 0))
		.videoCodec("libx264")
		.audioCodec("aac")
		.outputOptions([
			"-threads 1", // Keep the separate YouTube normalization policy unchanged.
			"-loglevel error",
			"-stats",
			"-map 0:v:0", "-map 0:a:0?", "-pix_fmt yuv420p",
			"-preset ultrafast", "-crf 22", "-c:a aac", "-b:a 128k",
			"-ar 48000", "-ac 2", "-start_at_zero",
			"-avoid_negative_ts make_zero", "-movflags +faststart",
			"-max_muxing_queue_size 1024",
		])
		.output(outputPath);
	return runCommand(command, outputPath, null, onResources);
}

export const QUALITY_PRESETS = {
	low: { crf: 28, preset: "ultrafast", audioBitrate: "128k" },
	medium: { crf: 25, preset: "ultrafast", audioBitrate: "128k" },
	// High and maximum quality presets use superfast for fast encode times on constrained servers.
	// Memory usage is bounded separately by single-threaded execution (-threads 1, -filter_threads 1)
	// and disabling x264 lookahead (-x264-params rc-lookahead=0:threads=1).
	high: { crf: 22, preset: "superfast", audioBitrate: "160k" },
	maximum: { crf: 20, preset: "superfast", audioBitrate: "192k" },
};

function runCommand(command, outputPath, onProgress, onResources, sourceStreams) {
	// fluent-ffmpeg automatically probes for progress, without input headers.
	// Reuse the already authenticated source probe rather than issue that request.
	if (sourceStreams) {
		command.ffprobe = (...args) => {
			const callback = args[args.length - 1];
			queueMicrotask(() => callback(null, {
				format: { duration: sourceStreams.metadata?.duration },
				streams: [...sourceStreams.videoStreams, ...sourceStreams.audioStreams],
			}));
		};
	}
	const monitor = createResourceMonitor();
	let started = false;
	let finished = false;
	let concurrencyAtStart = 0;
	let ffmpegArgs = "";
	let ffmpegExitCode = null;

	return new Promise((resolve, reject) => {
		async function finish(error) {
			if (finished) return;
			finished = true;
			if (started) activeFfmpegJobs -= 1;
			try {
				// Keep only the last 2000 characters of ffmpeg error output to avoid
				// buffering large strings in Node memory, and sanitize any credentials.
				if (error) {
					const rawMsg = String(error?.message || error || "");
					const sanitizedMsg = redactSecrets(rawMsg);
					const shortTail = sanitizedMsg.length > 2000 ? sanitizedMsg.slice(-2000) : sanitizedMsg;
					error = Object.assign(
						new Error(shortTail),
						{ code: ffmpegExitCode ?? error?.code },
					);
				}
				const resources = await monitor.stop();
				await onResources?.({ ...resources, concurrentFfmpegJobsAtStart: concurrencyAtStart });
				if (error) reject(error);
				else resolve(outputPath);
			} catch (monitorError) {
				reject(error || monitorError);
			}
		}
		command
			.on("start", (cmdLine) => {
				started = true;
				activeFfmpegJobs += 1;
				concurrencyAtStart = activeFfmpegJobs;
				// Redact any tokens, keys, or authorization headers from the logged arguments
				ffmpegArgs = redactSecrets(cmdLine);
				console.log(JSON.stringify({
					event: "ffmpeg_spawned",
					command: ffmpegArgs,
				}));
				if (command.ffmpegProc) {
					command.ffmpegProc.on("exit", (code, signal) => {
						ffmpegExitCode = code !== null ? code : (signal ? -1 : 0);
					});
					monitor.attach(command.ffmpegProc);
					monitor.start();
				}
			})
			.on("end", () => {
				console.log(JSON.stringify({
					event: "ffmpeg_finished",
					exitCode: ffmpegExitCode ?? 0,
				}));
				void finish();
			})
			.on("error", (error) => {
				const sanitizedTail = redactSecrets(error?.message || error || "");
				console.log(JSON.stringify({
					event: "ffmpeg_failed",
					exitCode: ffmpegExitCode ?? 1,
					errorTail: sanitizedTail.slice(-200),
				}));
				void finish(error);
			});
		if (onProgress) command.on("progress", (progress) => {
			Promise.resolve().then(() => onProgress(Math.min(100, progress.percent || 0)))
				.catch(() => {});
		});
		command.run();
	});
}

function encodedAudioOptions(quality) {
	return [
		"-c:a aac",
		`-b:a ${quality.audioBitrate}`,
		"-ar 48000",
		"-ac 2",
		"-af asetpts=PTS-STARTPTS",
	];
}

function commonOutputOptions() {
	return [
		// Quiet log level with stats: suppress informational stderr output to minimize
		// Node buffer usage, but retain progress stats so fluent-ffmpeg progress events can fire.
		"-loglevel error",
		"-stats",
		"-movflags +faststart",
		"-avoid_negative_ts make_zero",
		"-max_muxing_queue_size 1024",
	];
}

export async function exportClip(options) {
	const {
		sourcePath,
		outputPath,
		start,
		end,
		width,
		height,
		quality = "high",
		cropMode = "fill",
		captionsSrtPath = null,
		inputOptions = [],
		sourceStreams = null,
		disableStreamCopy = false,
		onProgress,
		onDecision,
		onResources,
		measureProbe = (work) => work(),
	} = options;
	const duration = Math.max(0.1, Number(end) - Number(start));
	const q = QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;

	let copyPlan = disableStreamCopy
		? { copyVideo: false, copyAudio: false, reason: "stream_copy_disabled" }
		: await measureProbe(() => getStreamCopyPlan({
			sourcePath,
			inputOptions,
			start,
			end,
			cropMode,
			captionsSrtPath,
			streams: sourceStreams,
		}));
	onDecision?.(copyPlan);

	if (copyPlan.copyVideo) {
		const outputOptions = [
			"-map 0:v:0",
			"-map 0:a:0?",
			"-c:v copy",
			...(copyPlan.copyAudio ? ["-c:a copy"] : encodedAudioOptions(q)),
			...commonOutputOptions(),
		];
		// Pre-input seek: fluent-ffmpeg's setStartTime(start) already placed -ss before -i.
		// We kept the explicit inputOptions(["-ss", String(start), ...inputOptions]) to ensure
		// it is explicitly positioned before the input. Output duration is still controlled by
		// setDuration(-t) so the clip length is correct.
		const command = ffmpeg(sourcePath)
			.inputOptions(["-ss", String(start), ...inputOptions])
			.setDuration(duration)
			.outputOptions(outputOptions)
			.output(outputPath);

		try {
			await runCommand(command, outputPath, onProgress, onResources, sourceStreams);
			const actualDuration = await measureProbe(() => probeDuration(outputPath));
			const fps = Number(sourceStreams?.videoStreams?.[0]?.r_frame_rate?.split("/")[0]) /
				Number(sourceStreams?.videoStreams?.[0]?.r_frame_rate?.split("/")[1]);
			const tolerance = Number.isFinite(fps) && fps > 0
				? Math.max(0.05, 1 / fps + 0.005)
				: 0.05;
			if (Math.abs(actualDuration - duration) > tolerance) {
				throw new Error("Stream-copy output duration exceeded the allowed frame-boundary tolerance.");
			}
			return outputPath;
		} catch {
			fs.rmSync(outputPath, { force: true });
			copyPlan = {
				copyVideo: false,
				copyAudio: false,
				reason: "stream_copy_failed_or_inaccurate_fallback_reencode",
			};
			onDecision?.(copyPlan);
		}
	}

	const captionFilter = buildCaptionFilter(captionsSrtPath, width, height);
	let command;

	if (cropMode === "fit") {
		const [backgroundCrop, backgroundScale] = buildFillFilter(width, height, 0.5);
		const filters = [
			"[0:v]setpts=PTS-STARTPTS[vpts]",
			"[vpts]split=2[bg][fg]",
			`[bg]${backgroundCrop},${backgroundScale},boxblur=luma_radius=10:luma_power=1[bgblur]`,
			`[fg]scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease:flags=bilinear[fgfit]`,
			"[bgblur][fgfit]overlay=(W-w)/2:(H-h)/2[composed]",
			captionFilter ? `[composed]${captionFilter}[vout]` : "[composed]null[vout]",
		];
		command = ffmpeg(sourcePath)
			.complexFilter(filters)
			.outputOptions(["-map [vout]"]);
	} else if (cropMode === "fill" || cropMode === "original") {
		const filters = ["setpts=PTS-STARTPTS"];
		if (cropMode === "fill") filters.push(...buildFillFilter(width, height));
		if (captionFilter) filters.push(captionFilter);
		command = ffmpeg(sourcePath)
			.videoFilters(filters)
			.outputOptions(["-map 0:v:0"]);
	} else {
		throw new Error(`Unsupported crop mode: ${cropMode}`);
	}

	command
		// Pre-input seek and decoder thread limiting:
		// fluent-ffmpeg's setStartTime(start) already placed -ss before -i. We kept the explicit
		// inputOption ["-ss", String(start)] to ensure it remains positioned before -i.
		// We add "-threads 1" as an input option for re-encodes to limit decoder threads as well.
		// Redundant -accurate_seek was removed since pre-input seeking is keyframe-accurate.
		.inputOptions(["-ss", String(start), "-threads 1", ...inputOptions])
		.setDuration(duration)
		.outputOptions([
			"-map 0:a:0?",
			"-vcodec libx264",
			`-crf ${q.crf}`,
			`-preset ${q.preset}`,
			"-pix_fmt yuv420p",
			// Limit re-encoding to one thread so the process fits in 512 MB.
			// FFmpeg's default is "auto" which can spawn as many threads as CPU
			// cores; each x264 thread holds its own lookahead buffer and frame
			// cache, which adds up quickly on a 512 MB Render instance.
			"-threads 1",
			// One filter-graph thread for the same reason.
			"-filter_threads 1",
			// Tell x264 explicitly: one thread and zero lookahead frames.
			// rc-lookahead=0 stops x264 from buffering future frames to decide
			// the current frame's quality. It trades a tiny bit of compression
			// efficiency for a large memory saving.
			"-x264-params rc-lookahead=0:threads=1",
			...encodedAudioOptions(q),
			"-start_at_zero",
			...commonOutputOptions(),
		])
		.output(outputPath);

	return runCommand(command, outputPath, onProgress, onResources, sourceStreams);
}
