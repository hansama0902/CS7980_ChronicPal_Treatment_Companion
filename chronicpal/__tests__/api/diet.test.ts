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

vi.mock('@/services/dietService', () => ({
  createDietEntry: vi.fn(),
  getDietEntries: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { createDietEntry, getDietEntries } from '@/services/dietService';
import { GET, POST } from '@/app/api/diet/route';

const mockCreate = createDietEntry as ReturnType<typeof vi.fn>;
const mockGet = getDietEntries as ReturnType<typeof vi.fn>;

const NOW = '2026-04-19T10:00:00.000Z';
const mockEntry = {
  id: 'd-1',
  userId: 'test-user-id',
  meal: 'Chicken breast',
  mealType: 'LUNCH',
  purineLevel: 'LOW',
  riskScore: null,
  aiAnalysis: null,
  date: new Date(NOW),
  createdAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/diet', () => {
  it('returns 200 with diet entry list', async () => {
    mockGet.mockResolvedValue([mockEntry]);
    const req = new NR('http://localhost/api/diet');
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('test-user-id', {});
  });

  it('passes date range query params to the service', async () => {
    mockGet.mockResolvedValue([]);
    const req = new NR(`http://localhost/api/diet?from=${NOW}&to=${NOW}`);
    await GET(req, { params: Promise.resolve({}) });
    expect(mockGet).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ from: NOW, to: NOW }),
    );
  });

  it('returns 400 when query params fail validation', async () => {
    const req = new NR('http://localhost/api/diet?from=not-a-date');
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe('POST /api/diet', () => {
  it('returns 201 with created diet entry', async () => {
    mockCreate.mockResolvedValue(mockEntry);
    const req = new NR('http://localhost/api/diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Chicken breast', mealType: 'LUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.meal).toBe('Chicken breast');
  });

  it('returns 400 when meal is missing', async () => {
    const req = new NR('http://localhost/api/diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealType: 'LUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('returns 400 when mealType is invalid', async () => {
    const req = new NR('http://localhost/api/diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Eggs', mealType: 'BRUNCH', date: NOW }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is missing', async () => {
    const req = new NR('http://localhost/api/diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Eggs', mealType: 'BREAKFAST' }),
    });
    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });
});
