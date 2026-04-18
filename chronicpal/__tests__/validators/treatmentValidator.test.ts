import { describe, expect, it } from 'vitest';
import { TreatmentType } from '@/types/treatment';
import {
  CreateTreatmentSchema,
  TreatmentQuerySchema,
  UpdateTreatmentSchema,
} from '@/validators/treatmentValidator';

const VALID_DATE = '2026-03-22T10:00:00.000Z';

describe('CreateTreatmentSchema', () => {
  it('accepts a fully populated valid input', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      uricAcidLevel: 6.2,
      painScore: 3,
      notes: 'Feeling okay',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (only required fields)', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.MEDICATION,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing date', () => {
    const result = CreateTreatmentSchema.safeParse({ type: TreatmentType.INFUSION });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid date string', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: 'not-a-date',
      type: TreatmentType.INFUSION,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid type', () => {
    const result = CreateTreatmentSchema.safeParse({ date: VALID_DATE, type: 'SURGERY' });
    expect(result.success).toBe(false);
  });

  it('rejects painScore above 10', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      painScore: 11,
    });
    expect(result.success).toBe(false);
  });

  it('rejects painScore below 0', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      painScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer painScore', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      painScore: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects uricAcidLevel above 30', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      uricAcidLevel: 31,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative uricAcidLevel', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      uricAcidLevel: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes exceeding 1000 characters', () => {
    const result = CreateTreatmentSchema.safeParse({
      date: VALID_DATE,
      type: TreatmentType.INFUSION,
      notes: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all three TreatmentType values', () => {
    for (const type of Object.values(TreatmentType)) {
      const result = CreateTreatmentSchema.safeParse({ date: VALID_DATE, type });
      expect(result.success).toBe(true);
    }
  });
});

describe('UpdateTreatmentSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = UpdateTreatmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial update', () => {
    const result = UpdateTreatmentSchema.safeParse({ painScore: 5 });
    expect(result.success).toBe(true);
  });

  it('still rejects invalid painScore', () => {
    const result = UpdateTreatmentSchema.safeParse({ painScore: 100 });
    expect(result.success).toBe(false);
  });
});

describe('TreatmentQuerySchema', () => {
  it('accepts empty query params', () => {
    expect(TreatmentQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid from/to datetimes', () => {
    const result = TreatmentQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-22T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid from datetime', () => {
    const result = TreatmentQuerySchema.safeParse({ from: 'last-month' });
    expect(result.success).toBe(false);
  });
});
