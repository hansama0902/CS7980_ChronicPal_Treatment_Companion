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
  // Destructure known safe top-level fields; sanitize everything else.
  // `stack` is set by the errors() format on Error objects — preserve it.
  const { level, message, timestamp: ts, stack, ...meta } = info as Record<string, unknown> & {
    level: string;
    message: string;
    timestamp?: string;
    stack?: string;
  };
  const sanitized: Record<string, unknown> = { level, message };
  if (ts !== undefined) sanitized.timestamp = ts;
  if (stack !== undefined) sanitized.stack = stack;
  return { ...sanitized, ...sanitizeMeta(meta) };
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp(), sanitizeFormat(), json()),
  transports: [new winston.transports.Console()],
});
