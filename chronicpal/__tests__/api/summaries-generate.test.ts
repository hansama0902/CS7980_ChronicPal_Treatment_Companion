import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/routeAuth', () => ({
  withAuth:
    (
      handler: (
        userId: string,
        req: NextRequest,
        params: Record<string, string>,
      ) => Promise<NextResponse>,
    ) =>
    async (
      req: NextRequest,
      ctx?: { params?: Promise<Record<string, string>> },
    ): Promise<NextResponse> => {
      const params = ctx?.params ? await ctx.params : {};
      return handler('test-user-id', req, params);
    },
}));

vi.mock('@/services/summaryGenerator', () => ({
  generateVisitSummary: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { generateVisitSummary } from '@/services/summaryGenerator';
import { AppError } from '@/lib/errors';
import { POST } from '@/app/api/summaries/generate/route';

const mockGenerate = generateVisitSummary as ReturnType<typeof vi.fn>;

const START = '2026-01-01T00:00:00.000Z';
const END = '2026-04-01T00:00:00.000Z';

const mockResult = {
  rawData: {
    treatmentSummary: {
      infusionsCount: 1,
      infusionDates: [],
      hasReactions: false,
      nextScheduled: null,
    },
    labTrends: {
      uricAcidTrend: [],
      latestUricAcid: 5.5,
      percentChange: null,
      aboveTarget: false,
      targetMgdl: 6.0,
    },
    symptomOverview: { avgPainScore: null, severeFlares: [], flareFreeDays: 90, totalDays: 90 },
    dietCompliance: { compliancePercent: 80, totalMeals: 10, lowPurineMeals: 8, highRiskItems: [] },
  },
  aiNarrative: {
    treatmentSummary: 'Good progress',
    labTrends: 'Stable levels',
    symptomOverview: 'Minimal symptoms',
    dietCompliance: 'High compliance',
    keyConcerns: ['Discuss uric acid levels'],
  },
  dateRange: { start: '2026-01-01', end: '2026-04-01' },
  generatedAt: new Date().toISOString(),
};

beforeEach(() => vi.clearAllMocks());

describe('POST /api/summaries/generate', () => {
  it('returns 200 with summary on valid request', async () => {
    mockGenerate.mockResolvedValue(mockResult);
    const req = new NR('http://localhost/api/summaries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: START, endDate: END }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.aiNarrative.treatmentSummary).toBe('Good progress');
  });

  it('returns 400 when dates are missing', async () => {
    const req = new NR('http://localhost/api/summaries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns 400 when startDate is after endDate', async () => {
    const req = new NR('http://localhost/api/summaries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: END, endDate: START }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('returns AppError statusCode when service throws AppError', async () => {
    mockGenerate.mockRejectedValue(new AppError(429, 'Rate limit exceeded'));
    const req = new NR('http://localhost/api/summaries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: START, endDate: END }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Rate limit exceeded');
  });

  it('returns 500 when service throws unknown error', async () => {
    mockGenerate.mockRejectedValue(new Error('Unexpected failure'));
    const req = new NR('http://localhost/api/summaries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: START, endDate: END }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Summary generation failed');
  });
});
