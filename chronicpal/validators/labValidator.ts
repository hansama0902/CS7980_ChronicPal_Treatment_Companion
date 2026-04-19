import { z } from 'zod';
import { MAX_LAB_URIC_ACID_MGDL } from '@/lib/constants';
import { dateRangeQuerySchema, isoDatetimeField, notesField } from './shared';

export const CreateLabSchema = z.object({
  date: isoDatetimeField('date'),
  uricAcidLevel: z
    .number()
    .gt(0, { message: 'uricAcidLevel must be > 0 mg/dL' })
    .max(MAX_LAB_URIC_ACID_MGDL, {
      message: `uricAcidLevel must be ≤ ${MAX_LAB_URIC_ACID_MGDL} mg/dL`,
    }),
  notes: notesField,
});

export const UpdateLabSchema = CreateLabSchema.partial();

export const LabQuerySchema = dateRangeQuerySchema;

export type CreateLabInput = z.infer<typeof CreateLabSchema>;
export type UpdateLabInput = z.infer<typeof UpdateLabSchema>;
export type LabQueryInput = z.infer<typeof LabQuerySchema>;
