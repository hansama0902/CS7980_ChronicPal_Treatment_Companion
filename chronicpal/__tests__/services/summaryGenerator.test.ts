import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMessagesCreate = vi.hoisted(() => vi.fn());
const mockCheckSummaryRateLimit = vi.hoisted(() => vi.fn());
const mockTreatmentFindMany = vi.hoisted(() => vi.fn());
const mockLabFindMany = vi.hoisted(() => vi.fn());
const mockSymptomFindMany = vi.hoisted(() => vi.fn());
const mockDietFindMany = vi.hoisted(() => vi.fn());
const mockTreatmentFindFirst = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    treatmentEntry: {
      findMany: mockTreatmentFindMany,
      findFirst: mockTreatmentFindFirst,
    },
    labResult: { findMany: mockLabFindMany },
    symptomEntry: { findMany: mockSymptomFindMany },
    dietEntry: { findMany: mockDietFindMany },
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  checkSummaryRateLimit: mockCheckSummaryRateLimit,
}));

import { generateVisitSummary } from '@/services/summaryGenerator';
import { BadRequestError, TooManyRequestsError } from '@/lib/errors';

const USER_ID = 'sg-user-1';
const START = new Date('2026-01-01T00:00:00.000Z');
const END = new Date('2026-04-01T00:00:00.000Z');

const VALID_NARRATIVE = {
  treatmentSummary: 'Good progress on infusions.',
  labTrends: 'Uric acid is trending down.',
  symptomOverview: 'Minimal flares recorded.',
  dietCompliance: 'Diet compliance is high.',
  keyConcerns: ['Discuss uric acid target with doctor'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckSummaryRateLimit.mockReturnValue({ allowed: true, remaining: 4 });
  mockTreatmentFindMany.mockResolvedValue([
    { date: new Date('2026-02-01'), type: 'INFUSION', notes: 'Mild reaction' },
    { date: new Date('2026-03-01'), type: 'INFUSION', notes: '' },
  ]);
  mockLabFindMany.mockResolvedValue([
    { date: new Date('2026-02-15'), uricAcidLevel: 7.0 },
    { date: new Date('2026-03-15'), uricAcidLevel: 5.5 },
  ]);
  mockSymptomFindMany.mockResolvedValue([
    { date: new Date('2026-02-10'), severity: 8, symptomType: 'JOINT_PAIN' },
    { date: new Date('2026-03-05'), severity: 3, symptomType: 'FATIGUE' },
  ]);
  mockDietFindMany.mockResolvedValue([
    { meal: 'Chicken breast', purineLevel: 'LOW' },
    { meal: 'Salad', purineLevel: 'LOW' },
    { meal: 'Red meat', purineLevel: 'HIGH' },
  ]);
  mockTreatmentFindFirst.mockResolvedValue({ date: new Date('2026-05-01') });
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(VALID_NARRATIVE) }],
  });
});

describe('generateVisitSummary', () => {
  it('returns a complete ISummaryResult with aiNarrative and rawData', async () => {
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.aiNarrative.treatmentSummary).toBe('Good progress on infusions.');
    expect(result.rawData.treatmentSummary.infusionsCount).toBe(2);
    expect(result.rawData.labTrends.latestUricAcid).toBe(5.5);
    expect(result.dateRange.start).toBe('2026-01-01');
    expect(result.dateRange.end).toBe('2026-04-01');
  });

  it('detects hasReactions when any infusion has notes', async () => {
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.treatmentSummary.hasReactions).toBe(true);
  });

  it('includes nextScheduled from findFirst result', async () => {
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.treatmentSummary.nextScheduled).toBe('2026-05-01');
  });

  it('sets nextScheduled to null when no future treatment exists', async () => {
    mockTreatmentFindFirst.mockResolvedValue(null);
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.treatmentSummary.nextScheduled).toBeNull();
  });

  it('marks aboveTarget when latest uric acid exceeds threshold', async () => {
    mockLabFindMany.mockResolvedValue([{ date: new Date('2026-03-15'), uricAcidLevel: 9.0 }]);
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.labTrends.aboveTarget).toBe(true);
  });

  it('counts severe flares (severity >= 7)', async () => {
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.symptomOverview.severeFlares).toHaveLength(1);
  });

  it('computes diet compliance percentage correctly', async () => {
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.dietCompliance.compliancePercent).toBe(67);
  });

  it('throws TooManyRequestsError when rate limit is exceeded', async () => {
    mockCheckSummaryRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    await expect(generateVisitSummary(USER_ID, START, END)).rejects.toBeInstanceOf(
      TooManyRequestsError,
    );
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when AI returns non-JSON text', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not json at all' }],
    });
    await expect(generateVisitSummary(USER_ID, START, END)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws BadRequestError when AI response is missing required fields', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ treatmentSummary: 'Only this' }) }],
    });
    await expect(generateVisitSummary(USER_ID, START, END)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws BadRequestError when keyConcerns is not an array', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ...VALID_NARRATIVE, keyConcerns: 'not an array' }),
        },
      ],
    });
    await expect(generateVisitSummary(USER_ID, START, END)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws BadRequestError when AI response has no text block', async () => {
    mockMessagesCreate.mockResolvedValue({ content: [] });
    await expect(generateVisitSummary(USER_ID, START, END)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('strips markdown code fences from AI response', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n' + JSON.stringify(VALID_NARRATIVE) + '\n```' }],
    });
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.aiNarrative.keyConcerns).toHaveLength(1);
  });

  it('handles empty data sets gracefully', async () => {
    mockTreatmentFindMany.mockResolvedValue([]);
    mockLabFindMany.mockResolvedValue([]);
    mockSymptomFindMany.mockResolvedValue([]);
    mockDietFindMany.mockResolvedValue([]);
    mockTreatmentFindFirst.mockResolvedValue(null);
    const result = await generateVisitSummary(USER_ID, START, END);
    expect(result.rawData.treatmentSummary.infusionsCount).toBe(0);
    expect(result.rawData.labTrends.latestUricAcid).toBeNull();
    expect(result.rawData.dietCompliance.totalMeals).toBe(0);
    expect(result.rawData.dietCompliance.compliancePercent).toBe(0);
  });
});
