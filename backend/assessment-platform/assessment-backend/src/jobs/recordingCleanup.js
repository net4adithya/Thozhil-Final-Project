const fs = require('fs');
const path = require('path');
const Recording = require('../models/Recording');
const { UPLOAD_ROOT } = require('../middleware/uploadRecording');
const env = require('../config/env');

/**
 * Deletes every Recording whose createdAt is older than RECORDING_RETENTION_HOURS
 * (default 24h) — both the file on disk and its Mongo document. Runs as a plain
 * setInterval rather than a cron dependency since this app has no other scheduled jobs
 * yet; if that changes, node-cron would be a better fit for cron-syntax scheduling.
 *
 * Deletes are best-effort per recording: one missing file or one failed DB delete
 * doesn't stop the rest of the batch from being cleaned up, and every failure is logged
 * with the recording id so it can be investigated/retried manually if needed.
 */
async function cleanupOldRecordings() {
  const cutoff = new Date(Date.now() - env.recordingCleanup.retentionHours * 60 * 60 * 1000);

  const stale = await Recording.find({ createdAt: { $lt: cutoff } }).select('_id filePath').lean();
  if (stale.length === 0) {
    console.log('[recording-cleanup] nothing older than the retention window — nothing to do');
    return;
  }

  console.log(`[recording-cleanup] found ${stale.length} recording(s) older than ${env.recordingCleanup.retentionHours}h — deleting`);

  let filesDeleted = 0;
  let filesMissing = 0;
  let dbDeleted = 0;
  let errors = 0;

  for (const recording of stale) {
    try {
      // Guard against a corrupted/unexpected filePath ever resolving outside the
      // uploads root — same check used when serving downloads in recordingController.js.
      const absolutePath = path.join(UPLOAD_ROOT, recording.filePath);
      if (!absolutePath.startsWith(UPLOAD_ROOT)) {
        console.error(`[recording-cleanup] refusing to delete suspicious path for recording ${recording._id}: ${recording.filePath}`);
        errors += 1;
        continue;
      }

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        filesDeleted += 1;
      } else {
        filesMissing += 1;
      }

      await Recording.deleteOne({ _id: recording._id });
      dbDeleted += 1;
    } catch (err) {
      errors += 1;
      console.error(`[recording-cleanup] failed to clean up recording ${recording._id}:`, err.message);
    }
  }

  console.log(
    `[recording-cleanup] done — files deleted: ${filesDeleted}, files already missing: ${filesMissing}, db records removed: ${dbDeleted}, errors: ${errors}`
  );
}

let intervalId = null;

/**
 * Runs an initial sweep shortly after startup (so a backend that's been down for a
 * while doesn't leave a huge backlog sitting until the first interval tick), then
 * repeats every RECORDING_CLEANUP_INTERVAL_MINUTES (default 60). Call once from
 * server.js after the DB connection is established.
 */
function startRecordingCleanupJob() {
  if (intervalId) return; // already started — avoid double-scheduling on hot reload etc.

  const intervalMs = env.recordingCleanup.intervalMinutes * 60 * 1000;
  console.log(
    `[recording-cleanup] scheduled — retention ${env.recordingCleanup.retentionHours}h, sweeping every ${env.recordingCleanup.intervalMinutes}m`
  );

  setTimeout(() => {
    cleanupOldRecordings().catch((err) => console.error('[recording-cleanup] sweep failed:', err.message));
  }, 30 * 1000); // small delay so it doesn't compete with the rest of server startup

  intervalId = setInterval(() => {
    cleanupOldRecordings().catch((err) => console.error('[recording-cleanup] sweep failed:', err.message));
  }, intervalMs);
}

function stopRecordingCleanupJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { startRecordingCleanupJob, stopRecordingCleanupJob, cleanupOldRecordings };
