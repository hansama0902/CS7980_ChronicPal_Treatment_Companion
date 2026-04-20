import { describe, expect, it } from 'vitest';
import { GenerateSummarySchema } from '@/validators/summaryValidator';

const START = '2026-01-01T00:00:00.000Z';
const END = '2026-04-01T00:00:00.000Z';

describe('GenerateSummarySchema', () => {
  it('accepts valid startDate and endDate', () => {
    const result = GenerateSummarySchema.safeParse({ startDate: START, endDate: END });
    expect(result.success).toBe(true);
  });

  it('rejects missing startDate', () => {
    const result = GenerateSummarySchema.safeParse({ endDate: END });
    expect(result.success).toBe(false);
  });

  it('rejects missing endDate', () => {
    const result = GenerateSummarySchema.safeParse({ startDate: START });
    expect(result.success).toBe(false);
  });

  it('rejects non-ISO startDate', () => {
    const result = GenerateSummarySchema.safeParse({ startDate: 'March 1 2026', endDate: END });
    expect(result.success).toBe(false);
  });

  it('rejects non-ISO endDate', () => {
    const result = GenerateSummarySchema.safeParse({ startDate: START, endDate: 'April 1 2026' });
    expect(result.success).toBe(false);
  });

  it('rejects when startDate equals endDate', () => {
    const result = GenerateSummarySchema.safeParse({ startDate: START, endDate: START });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('startDate must be before endDate');
  });

  it('rejects when startDate is after endDate', () => {
    const result = GenerateSummarySchema.safeParse({ startDate: END, endDate: START });
    expect(result.success).toBe(false);
  });
});
