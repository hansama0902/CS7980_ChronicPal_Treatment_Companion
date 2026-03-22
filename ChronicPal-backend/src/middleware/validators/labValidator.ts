import { z } from 'zod';
import { MAX_LAB_URIC_ACID_MGDL, MAX_NOTES_LENGTH } from '../../utils/constants';

export const CreateLabSchema = z.object({
  date: z.string().datetime({ message: 'date must be a valid ISO 8601 datetime' }),
  uricAcidLevel: z
    .number()
    .gt(0, { message: 'uricAcidLevel must be greater than 0' })
    .max(MAX_LAB_URIC_ACID_MGDL, { message: `uricAcidLevel must be ≤ ${MAX_LAB_URIC_ACID_MGDL} mg/dL` }),
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, { message: `notes must be ≤ ${MAX_NOTES_LENGTH} characters` })
    .optional(),
});

export const LabQuerySchema = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 datetime' }).optional(),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 datetime' }).optional(),
});

export type CreateLabInput = z.infer<typeof CreateLabSchema>;
export type LabQueryInput = z.infer<typeof LabQuerySchema>;
