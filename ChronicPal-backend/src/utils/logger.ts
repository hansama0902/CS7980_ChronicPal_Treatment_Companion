import winston from 'winston';

// PHI-safe allowlist — health data fields must NEVER appear here (ADR-6).
// Allowed: operational metadata only.
const ALLOWED_META_FIELDS = new Set([
  'requestId',
  'userId',
  'path',
  'method',
  'statusCode',
  'durationMs',
]);

/**
 * Strips any metadata keys not on the PHI-safe allowlist before logging.
 */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of Object.keys(meta)) {
    if (ALLOWED_META_FIELDS.has(key)) {
      safe[key] = meta[key];
    }
  }
  return safe;
}

const { combine, timestamp, json, errors } = winston.format;

const sanitizeFormat = winston.format((info) => {
  const { level, message, timestamp: ts, stack, ...meta } = info;
  return { level, message, timestamp: ts, stack, ...sanitizeMeta(meta as Record<string, unknown>) };
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp(), sanitizeFormat(), json()),
  transports: [new winston.transports.Console()],
});
