import { describe, expect, it } from 'vitest';
import {
  CreateSymptomSchema,
  SymptomQuerySchema,
  UpdateSymptomSchema,
} from '@/validators/symptomValidator';

const VALID_DATE = '2026-03-22T10:00:00.000Z';

describe('CreateSymptomSchema', () => {
  it('accepts a fully populated valid input', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'Joint pain',
      severity: 5,
      notes: 'Mild swelling',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (no notes)', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'Fatigue',
      severity: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing date', () => {
    const result = CreateSymptomSchema.safeParse({ symptomType: 'Pain', severity: 4 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid date string', () => {
    const result = CreateSymptomSchema.safeParse({
      date: 'yesterday',
      symptomType: 'Pain',
      severity: 4,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing symptomType', () => {
    const result = CreateSymptomSchema.safeParse({ date: VALID_DATE, severity: 4 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty symptomType', () => {
    const result = CreateSymptomSchema.safeParse({ date: VALID_DATE, symptomType: '', severity: 4 });
    expect(result.success).toBe(false);
  });

  it('rejects symptomType longer than 100 characters', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'a'.repeat(101),
      severity: 4,
    });
    expect(result.success).toBe(false);
  });

  it('rejects severity below 1', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'Pain',
      severity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects severity above 10', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'Pain',
      severity: 11,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer severity', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'Pain',
      severity: 4.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts boundary severity values 1 and 10', () => {
    expect(
      CreateSymptomSchema.safeParse({ date: VALID_DATE, symptomType: 'Pain', severity: 1 }).success,
    ).toBe(true);
    expect(
      CreateSymptomSchema.safeParse({ date: VALID_DATE, symptomType: 'Pain', severity: 10 }).success,
    ).toBe(true);
  });

  it('rejects notes exceeding 1000 characters', () => {
    const result = CreateSymptomSchema.safeParse({
      date: VALID_DATE,
      symptomType: 'Pain',
      severity: 5,
      notes: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateSymptomSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateSymptomSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update with just severity', () => {
    expect(UpdateSymptomSchema.safeParse({ severity: 7 }).success).toBe(true);
  });

  it('still rejects invalid severity in partial update', () => {
    expect(UpdateSymptomSchema.safeParse({ severity: 0 }).success).toBe(false);
  });
});

describe('SymptomQuerySchema', () => {
  it('accepts empty query params', () => {
    expect(SymptomQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid from/to datetimes', () => {
    const result = SymptomQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-22T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid from datetime', () => {
    expect(SymptomQuerySchema.safeParse({ from: 'last-week' }).success).toBe(false);
  });
});
