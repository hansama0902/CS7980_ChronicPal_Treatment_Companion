import { z } from 'zod';
import { MAX_SYMPTOM_SEVERITY, MIN_SYMPTOM_SEVERITY } from '@/lib/constants';
import { dateRangeQuerySchema, isoDatetimeField, notesField } from './shared';

export const CreateSymptomSchema = z.object({
  date: isoDatetimeField('date'),
  symptomType: z
    .string()
    .min(1, { message: 'symptomType must not be empty' })
    .max(100, { message: 'symptomType must be ≤ 100 characters' }),
  severity: z
    .number()
    .int({ message: 'severity must be an integer' })
    .min(MIN_SYMPTOM_SEVERITY, { message: `severity must be ≥ ${MIN_SYMPTOM_SEVERITY}` })
    .max(MAX_SYMPTOM_SEVERITY, { message: `severity must be ≤ ${MAX_SYMPTOM_SEVERITY}` }),
  notes: notesField,
});

export const UpdateSymptomSchema = CreateSymptomSchema.partial();

export const SymptomQuerySchema = dateRangeQuerySchema;

export type CreateSymptomInput = z.infer<typeof CreateSymptomSchema>;
export type UpdateSymptomInput = z.infer<typeof UpdateSymptomSchema>;
export type SymptomQueryInput = z.infer<typeof SymptomQuerySchema>;
