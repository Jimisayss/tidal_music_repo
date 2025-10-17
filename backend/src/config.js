require('dotenv').config();

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  port: toInt(process.env.PORT, 4000),
  apiBaseUrl: process.env.TIDAL_API_BASE_URL || 'https://tidal.401658.xyz',
  cacheTtlMs: toInt(process.env.CACHE_TTL_MS, 60_000),
  cacheMaxEntries: toInt(process.env.CACHE_MAX_ENTRIES, 500),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 80)
};

