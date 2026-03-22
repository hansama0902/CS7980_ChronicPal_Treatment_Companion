import { describe, expect, it } from 'vitest';
import {
  CreateLabSchema,
  LabQuerySchema,
} from '../../middleware/validators/labValidator';

const VALID_DATE = '2026-03-22T10:00:00.000Z';

describe('CreateLabSchema', () => {
  it('accepts a fully populated valid input', () => {
    const result = CreateLabSchema.safeParse({
      date: VALID_DATE,
      uricAcidLevel: 6.2,
      notes: 'Routine draw',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (date and uricAcidLevel only)', () => {
    const result = CreateLabSchema.safeParse({
      date: VALID_DATE,
      uricAcidLevel: 5.0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing date', () => {
    const result = CreateLabSchema.safeParse({ uricAcidLevel: 6.2 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid date string', () => {
    const result = CreateLabSchema.safeParse({ date: 'not-a-date', uricAcidLevel: 6.2 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing uricAcidLevel', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE });
    expect(result.success).toBe(false);
  });

  it('rejects a negative uricAcidLevel', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE, uricAcidLevel: -0.1 });
    expect(result.success).toBe(false);
  });

  it('rejects uricAcidLevel of exactly 0 (non-positive)', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE, uricAcidLevel: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects uricAcidLevel above 20', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE, uricAcidLevel: 20.1 });
    expect(result.success).toBe(false);
  });

  it('rejects uricAcidLevel of exactly 20 + epsilon', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE, uricAcidLevel: 21 });
    expect(result.success).toBe(false);
  });

  it('accepts uricAcidLevel at the upper boundary of 20', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE, uricAcidLevel: 20 });
    expect(result.success).toBe(true);
  });

  it('accepts uricAcidLevel just above 0', () => {
    const result = CreateLabSchema.safeParse({ date: VALID_DATE, uricAcidLevel: 0.1 });
    expect(result.success).toBe(true);
  });

  it('rejects notes exceeding 1000 characters', () => {
    const result = CreateLabSchema.safeParse({
      date: VALID_DATE,
      uricAcidLevel: 6.2,
      notes: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('LabQuerySchema', () => {
  it('accepts empty query params', () => {
    expect(LabQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid from/to datetimes', () => {
    const result = LabQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-22T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid from datetime', () => {
    const result = LabQuerySchema.safeParse({ from: 'last-month' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid to datetime', () => {
    const result = LabQuerySchema.safeParse({ to: 'tomorrow' });
    expect(result.success).toBe(false);
  });
});
