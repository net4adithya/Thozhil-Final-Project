const env = require('./env');

/**
 * Thin wrapper around ioredis used for two things:
 *   1. Caching expensive, read-heavy admin report data (buildReportRows / question analysis)
 *      for a few seconds so a dashboard left open during grading doesn't re-aggregate the
 *      whole submissions collection on every poll.
 *   2. Nothing else touches Redis directly — Socket.IO push uses in-process emit since we
 *      only run a single Node process; if this is ever scaled horizontally, swap in
 *      @socket.io/redis-adapter using this same client.
 *
 * If REDIS_URL isn't configured, every method below becomes a safe no-op so the app runs
 * fine without Redis in dev — it just always computes fresh.
 */
let client = null;

if (env.redisUrl) {
  // Lazy require so environments without `ioredis` installed (or without Redis at all)
  // never pay the cost / risk a crash on boot.
  const Redis = require('ioredis');
  client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => 500,
    lazyConnect: false,
  });
  client.on('error', (err) => {
    console.warn('[redis] connection error (falling back to no-cache):', err.message);
  });
}

async function getJSON(key) {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setJSON(key, value, ttlSeconds) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache writes are best-effort — a failed write just means the next read recomputes.
  }
}

async function del(key) {
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Best-effort invalidation; a stale-for-a-few-seconds cache entry is an acceptable
    // trade-off, never worth failing the request over.
  }
}

module.exports = { client, getJSON, setJSON, del, enabled: !!client };
