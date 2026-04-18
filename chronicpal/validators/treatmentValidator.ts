import { z } from 'zod';
import {
  MAX_PAIN_SCORE,
  MAX_URIC_ACID_MGDL,
  MIN_PAIN_SCORE,
  MIN_URIC_ACID_MGDL,
} from '@/lib/constants';
import { TreatmentType } from '@/types/treatment';
import { dateRangeQuerySchema, isoDatetimeField, notesField } from './shared';

export const CreateTreatmentSchema = z.object({
  date: isoDatetimeField('date'),
  type: z.nativeEnum(TreatmentType, {
    message: 'type must be INFUSION, MEDICATION, or CLINIC_VISIT',
  }),
  uricAcidLevel: z
    .number()
    .min(MIN_URIC_ACID_MGDL, { message: `uricAcidLevel must be ≥ ${MIN_URIC_ACID_MGDL} mg/dL` })
    .max(MAX_URIC_ACID_MGDL, { message: `uricAcidLevel must be ≤ ${MAX_URIC_ACID_MGDL} mg/dL` })
    .optional(),
  painScore: z
    .number()
    .int({ message: 'painScore must be an integer' })
    .min(MIN_PAIN_SCORE, { message: `painScore must be ≥ ${MIN_PAIN_SCORE}` })
    .max(MAX_PAIN_SCORE, { message: `painScore must be ≤ ${MAX_PAIN_SCORE}` })
    .optional(),
  notes: notesField,
});

export const UpdateTreatmentSchema = CreateTreatmentSchema.partial();

export const TreatmentQuerySchema = dateRangeQuerySchema;

export type CreateTreatmentInput = z.infer<typeof CreateTreatmentSchema>;
export type UpdateTreatmentInput = z.infer<typeof UpdateTreatmentSchema>;
export type TreatmentQueryInput = z.infer<typeof TreatmentQuerySchema>;
