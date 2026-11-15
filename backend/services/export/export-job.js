import { processExportJob } from "./export-processing.js";

export { buildExportFilename } from "./export-preparation.js";
export {
	markExportError,
	uploadExportToDrive,
	retryPendingDriveConfirmations,
} from "./export-storage.js";

export const MAX_CONCURRENT_EXPORTS = Math.max(
	1,
	Number.parseInt(process.env.MAX_CONCURRENT_EXPORTS || "1", 10) || 1,
);
const exportQueue = [];
const pendingExportJobs = new Map();
export let activeExportJobs = 0;

export function getExportJobStats() {
	return {
		active: activeExportJobs,
		queued: exportQueue.length,
		limit: MAX_CONCURRENT_EXPORTS,
	};
}
function drainExportQueue() {
	while (activeExportJobs < MAX_CONCURRENT_EXPORTS && exportQueue.length > 0) {
		const next = exportQueue.shift();
		activeExportJobs += 1;

		console.log(JSON.stringify({
			event: "export_started",
			exportId: next.exportId,
		}));

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

	if (activeExportJobs >= MAX_CONCURRENT_EXPORTS) {
		console.log(JSON.stringify({
			event: "export_waiting",
			exportId,
			waiting: exportQueue.length,
		}));
	}

	drainExportQueue();
	return promise;
}