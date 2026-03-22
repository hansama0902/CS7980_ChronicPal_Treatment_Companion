import { z } from 'zod';
import { MAX_NOTES_LENGTH } from '../../utils/constants';

/**
 * Creates an ISO 8601 datetime string field with a field-name-scoped error message.
 * Used by create/update schemas (date) and query schemas (from, to).
 */
export const isoDatetimeField = (fieldName: string) =>
  z.string().datetime({ message: `${fieldName} must be a valid ISO 8601 datetime` });

/**
 * Optional free-text notes field shared across resource schemas.
 */
export const notesField = z
  .string()
  .max(MAX_NOTES_LENGTH, { message: `notes must be ≤ ${MAX_NOTES_LENGTH} characters` })
  .optional();

/**
 * Shared date-range query schema used by all list endpoints that support
 * filtering by a time window (GET /treatments, GET /labs, etc.).
 */
export const dateRangeQuerySchema = z.object({
  from: isoDatetimeField('from').optional(),
  to: isoDatetimeField('to').optional(),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
