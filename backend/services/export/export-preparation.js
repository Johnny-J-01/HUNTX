import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import ffmpegSvc from "../ffmpeg/config.js";
import { DIRS as VIDEO_DIRS } from "../video/paths.js";
import { deleteFile } from "./export-files.js";

const captionPreparations = new Map();

export function isPathInsideDir(childPath, parentDir) {
	if (!childPath || !parentDir) return false;
	const relative = path.relative(parentDir, childPath);
	return !relative.startsWith("..") && !path.isAbsolute(relative);
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

export async function prepareCaptionsFile(video, transcript, start, end, exportId) {
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