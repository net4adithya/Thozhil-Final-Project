require('dotenv').config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function parseCorsOrigin(raw) {
  if (!raw) return ['http://localhost:5173', 'http://localhost:5174'];
  if (raw === '*') return '*';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGO_URI || '',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  directUrl: process.env.DIRECT_URL || '',

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  compiler: {
    baseUrl: required('COMPILER_BASE_URL'),
    apiKey: required('COMPILER_API_KEY'),
    timeoutMs: parseInt(process.env.COMPILER_TIMEOUT_MS || '10000', 10),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_COMPILER_CALLS || '5', 10),
  },

  rateLimits: {
    runPerMinute: parseInt(process.env.RUN_RATE_LIMIT_PER_MINUTE || '15', 10),
    submitPerMinute: parseInt(process.env.SUBMIT_RATE_LIMIT_PER_MINUTE || '5', 10),
    verifyEmailPerMinute: parseInt(process.env.VERIFY_EMAIL_RATE_LIMIT_PER_MINUTE || '10', 10),
  },

  // Comma-separated list so both local dev apps (candidate frontend + admin) can hit
  // the API at once, e.g. "http://localhost:5173,http://localhost:5174" — the cors
  // package accepts an array of allowed origins natively. CORS_ORIGIN=* is kept as the
  // literal string "*" (not wrapped in an array) since cors only treats that bare
  // string as "allow any origin" — an array containing "*" would NOT match.
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),

  redisUrl: process.env.REDIS_URL || null,
  reportCacheTtlSeconds: parseInt(process.env.REPORT_CACHE_TTL_SECONDS || '15', 10),

  recordingCleanup: {
    retentionHours: parseInt(process.env.RECORDING_RETENTION_HOURS || '24', 10),
    intervalMinutes: parseInt(process.env.RECORDING_CLEANUP_INTERVAL_MINUTES || '60', 10),
  },
};
