const redis = require('../config/redis');
const env = require('../config/env');

const rowsKey = (examId) => `report:rows:${examId}`;
const analysisKey = (examId) => `report:question-analysis:${examId}`;

async function getCachedRows(examId) {
  return redis.getJSON(rowsKey(examId));
}
async function setCachedRows(examId, rows) {
  return redis.setJSON(rowsKey(examId), rows, env.reportCacheTtlSeconds);
}
async function getCachedAnalysis(examId) {
  return redis.getJSON(analysisKey(examId));
}
async function setCachedAnalysis(examId, data) {
  return redis.setJSON(analysisKey(examId), data, env.reportCacheTtlSeconds);
}

/**
 * Called anywhere a candidate's submission/status/violations change so the next
 * report read recomputes instead of serving stale cached rows. Cheap and safe to
 * call liberally — a cache miss just means one extra aggregation query.
 */
async function invalidateReportCache(examId) {
  await Promise.all([redis.del(rowsKey(examId)), redis.del(analysisKey(examId))]);
}

module.exports = {
  getCachedRows,
  setCachedRows,
  getCachedAnalysis,
  setCachedAnalysis,
  invalidateReportCache,
};
