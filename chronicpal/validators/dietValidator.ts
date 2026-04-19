import { z } from 'zod';
import { MAX_MEAL_DESCRIPTION_LENGTH } from '@/lib/constants';
import { dateRangeQuerySchema, isoDatetimeField } from './shared';

const MealTypeEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

export const CreateDietSchema = z.object({
  meal: z
    .string()
    .min(1, { message: 'meal is required' })
    .max(MAX_MEAL_DESCRIPTION_LENGTH, {
      message: `meal must be ≤ ${MAX_MEAL_DESCRIPTION_LENGTH} characters`,
    }),
  mealType: MealTypeEnum,
  date: isoDatetimeField('date'),
});

export const AnalyzeDietSchema = CreateDietSchema;

export const DietQuerySchema = dateRangeQuerySchema;

export type CreateDietInput = z.infer<typeof CreateDietSchema>;
export type AnalyzeDietInput = z.infer<typeof AnalyzeDietSchema>;
export type DietQueryInput = z.infer<typeof DietQuerySchema>;
