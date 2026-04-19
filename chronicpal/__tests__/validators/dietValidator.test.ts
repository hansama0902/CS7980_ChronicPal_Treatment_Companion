import { describe, expect, it } from 'vitest';
import { AnalyzeDietSchema, CreateDietSchema, DietQuerySchema } from '@/validators/dietValidator';

const NOW = '2026-04-19T10:00:00.000Z';

describe('CreateDietSchema', () => {
  it('accepts a valid diet entry', () => {
    const result = CreateDietSchema.safeParse({
      meal: 'Chicken breast with rice',
      mealType: 'LUNCH',
      date: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing meal field', () => {
    const result = CreateDietSchema.safeParse({ mealType: 'LUNCH', date: NOW });
    expect(result.success).toBe(false);
  });

  it('rejects empty meal string', () => {
    const result = CreateDietSchema.safeParse({ meal: '', mealType: 'LUNCH', date: NOW });
    expect(result.success).toBe(false);
  });

  it('rejects meal exceeding max length', () => {
    const result = CreateDietSchema.safeParse({
      meal: 'a'.repeat(501),
      mealType: 'LUNCH',
      date: NOW,
    });
    expect(result.success).toBe(false);
  });

  it('accepts meal at exactly max length', () => {
    const result = CreateDietSchema.safeParse({
      meal: 'a'.repeat(500),
      mealType: 'LUNCH',
      date: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid mealType values', () => {
    for (const mealType of ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']) {
      expect(CreateDietSchema.safeParse({ meal: 'Eggs', mealType, date: NOW }).success).toBe(true);
    }
  });

  it('rejects invalid mealType', () => {
    const result = CreateDietSchema.safeParse({ meal: 'Eggs', mealType: 'BRUNCH', date: NOW });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date string', () => {
    const result = CreateDietSchema.safeParse({
      meal: 'Eggs',
      mealType: 'BREAKFAST',
      date: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = CreateDietSchema.safeParse({ meal: 'Eggs', mealType: 'BREAKFAST' });
    expect(result.success).toBe(false);
  });
});

describe('AnalyzeDietSchema', () => {
  it('accepts same valid input as CreateDietSchema', () => {
    const result = AnalyzeDietSchema.safeParse({
      meal: 'Salmon fillet',
      mealType: 'DINNER',
      date: NOW,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing meal', () => {
    expect(AnalyzeDietSchema.safeParse({ mealType: 'DINNER', date: NOW }).success).toBe(false);
  });
});

describe('DietQuerySchema', () => {
  it('accepts empty object', () => {
    expect(DietQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid from and to dates', () => {
    expect(DietQuerySchema.safeParse({ from: NOW, to: NOW }).success).toBe(true);
  });

  it('rejects invalid from date', () => {
    expect(DietQuerySchema.safeParse({ from: 'bad-date' }).success).toBe(false);
  });

  it('rejects invalid to date', () => {
    expect(DietQuerySchema.safeParse({ to: 'not-a-datetime' }).success).toBe(false);
  });
});
