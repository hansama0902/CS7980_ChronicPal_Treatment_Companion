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

export const AnalyzeDietSchema = z
  .object({
    meal: z
      .string()
      .max(MAX_MEAL_DESCRIPTION_LENGTH, {
        message: `meal must be ≤ ${MAX_MEAL_DESCRIPTION_LENGTH} characters`,
      })
      .optional(),
    mealType: MealTypeEnum,
    date: isoDatetimeField('date'),
    imageBase64: z.string().optional(),
    imageMimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).optional(),
  })
  .refine((data) => (data.meal?.trim() ?? '') !== '' || data.imageBase64 !== undefined, {
    message: 'Either a meal description or an image is required',
  });

export const DietQuerySchema = dateRangeQuerySchema;

export const UpdateDietSchema = CreateDietSchema;

export type CreateDietInput = z.infer<typeof CreateDietSchema>;
export type AnalyzeDietInput = z.infer<typeof AnalyzeDietSchema>;
export type DietQueryInput = z.infer<typeof DietQuerySchema>;
export type UpdateDietInput = z.infer<typeof UpdateDietSchema>;
