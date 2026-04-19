import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/routeAuth', async () => {
  const { NextResponse } = await import('next/server');
  return {
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
        try {
          return await handler('test-user-id', req, params);
        } catch (err) {
          const e = err as { statusCode?: number; message?: string };
          if (typeof e.statusCode === 'number') {
            return NextResponse.json(
              { success: false, error: e.message ?? 'Error' },
              { status: e.statusCode },
            );
          }
          return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 },
          );
        }
      },
  };
});

vi.mock('@/services/aiService', () => ({
  analyzeDiet: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { analyzeDiet } from '@/services/aiService';
import { POST } from '@/app/api/diet/analyze/route';

const mockAnalyze = analyzeDiet as ReturnType<typeof vi.fn>;

const NOW = '2026-04-19T10:00:00.000Z';
const mockResult = {
  dietEntry: { id: 'd-1', userId: 'test-user-id' },
  analysis: {
    riskLevel: 'LOW',
    purineEstimate: 45,
    foods: [{ name: 'Chicken', risk: 'LOW', purine: 45 }],
    suggestion: 'Good choice for gout management.',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/diet/analyze', () => {
  it('returns 200 with analysis result on valid input', async () => {
    mockAnalyze.mockResolvedValue(mockResult);
    const req = new NR('http://localhost/api/diet/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Chicken breast', mealType: 'LUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.analysis.riskLevel).toBe('LOW');
  });

  it('calls analyzeDiet with correct userId from session', async () => {
    mockAnalyze.mockResolvedValue(mockResult);
    const req = new NR('http://localhost/api/diet/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Chicken breast', mealType: 'LUNCH', date: NOW }),
    });
    await POST(req, { params: Promise.resolve({}) });
    expect(mockAnalyze).toHaveBeenCalledWith('test-user-id', 'Chicken breast', 'LUNCH', NOW);
  });

  it('returns 400 and skips service when meal is missing', async () => {
    const req = new NR('http://localhost/api/diet/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealType: 'LUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('returns 400 when mealType is invalid', async () => {
    const req = new NR('http://localhost/api/diet/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Eggs', mealType: 'INVALID', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('returns 400 when service throws BadRequestError (AI parse failure)', async () => {
    const { BadRequestError } = await import('@/lib/errors');
    mockAnalyze.mockRejectedValue(new BadRequestError('AI returned non-JSON response'));
    const req = new NR('http://localhost/api/diet/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Chicken', mealType: 'LUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const { TooManyRequestsError } = await import('@/lib/errors');
    mockAnalyze.mockRejectedValue(new TooManyRequestsError('Rate limit exceeded'));
    const req = new NR('http://localhost/api/diet/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Chicken', mealType: 'LUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(429);
  });
});
