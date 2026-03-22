import { z } from 'zod';
import {
  MAX_NOTES_LENGTH,
  MAX_PAIN_SCORE,
  MAX_URIC_ACID_MGDL,
  MIN_PAIN_SCORE,
  MIN_URIC_ACID_MGDL,
} from '../../utils/constants';
import { TreatmentType } from '../../types/treatment';

export const CreateTreatmentSchema = z.object({
  date: z.string().datetime({ message: 'date must be a valid ISO 8601 datetime' }),
  type: z.nativeEnum(TreatmentType, { message: 'type must be INFUSION, MEDICATION, or CLINIC_VISIT' }),
  uricAcidLevel: z
    .number()
    .min(MIN_URIC_ACID_MGDL, { message: `uricAcidLevel must be ≥ ${MIN_URIC_ACID_MGDL}` })
    .max(MAX_URIC_ACID_MGDL, { message: `uricAcidLevel must be ≤ ${MAX_URIC_ACID_MGDL} mg/dL` })
    .optional(),
  painScore: z
    .number()
    .int({ message: 'painScore must be an integer' })
    .min(MIN_PAIN_SCORE, { message: `painScore must be ≥ ${MIN_PAIN_SCORE}` })
    .max(MAX_PAIN_SCORE, { message: `painScore must be ≤ ${MAX_PAIN_SCORE}` })
    .optional(),
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, { message: `notes must be ≤ ${MAX_NOTES_LENGTH} characters` })
    .optional(),
});

export const UpdateTreatmentSchema = CreateTreatmentSchema.partial();

export const TreatmentQuerySchema = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 datetime' }).optional(),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 datetime' }).optional(),
});

export type CreateTreatmentInput = z.infer<typeof CreateTreatmentSchema>;
export type UpdateTreatmentInput = z.infer<typeof UpdateTreatmentSchema>;
export type TreatmentQueryInput = z.infer<typeof TreatmentQuerySchema>;
