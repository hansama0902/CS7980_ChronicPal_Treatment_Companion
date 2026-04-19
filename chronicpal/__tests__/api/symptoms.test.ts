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

vi.mock('@/services/symptomService', () => ({
  createSymptom: vi.fn(),
  getSymptoms: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { createSymptom, getSymptoms } from '@/services/symptomService';
import { GET, POST } from '@/app/api/symptoms/route';

const mockCreate = createSymptom as ReturnType<typeof vi.fn>;
const mockGet = getSymptoms as ReturnType<typeof vi.fn>;

const NOW = '2026-03-22T10:00:00.000Z';
const mockSymptom = {
  id: 's-1',
  userId: 'test-user-id',
  date: new Date(NOW),
  symptomType: 'Joint pain',
  severity: 5,
  notes: null,
  createdAt: new Date(NOW),
  updatedAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/symptoms', () => {
  it('returns 200 with symptom list', async () => {
    mockGet.mockResolvedValue([mockSymptom]);
    const req = new NR('http://localhost/api/symptoms');

    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('test-user-id', {});
  });

  it('passes date range query params to service', async () => {
    mockGet.mockResolvedValue([]);
    const req = new NR(`http://localhost/api/symptoms?from=${NOW}&to=${NOW}`);

    await GET(req, { params: Promise.resolve({}) });

    expect(mockGet).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ from: NOW, to: NOW }),
    );
  });

  it('returns 400 when query params fail validation', async () => {
    const req = new NR('http://localhost/api/symptoms?from=not-a-date');

    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe('POST /api/symptoms', () => {
  it('returns 201 with created symptom', async () => {
    mockCreate.mockResolvedValue(mockSymptom);
    const req = new NR('http://localhost/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: NOW, symptomType: 'Joint pain', severity: 5 }),
    });

    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.symptomType).toBe('Joint pain');
  });

  it('returns 400 when body fails validation', async () => {
    const req = new NR('http://localhost/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity: 99 }),
    });

    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});
