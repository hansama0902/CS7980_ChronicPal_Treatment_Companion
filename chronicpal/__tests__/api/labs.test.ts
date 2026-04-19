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

vi.mock('@/services/labService', () => ({
  createLab: vi.fn(),
  getLabs: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { createLab, getLabs } from '@/services/labService';
import { GET, POST } from '@/app/api/labs/route';

const mockCreate = createLab as ReturnType<typeof vi.fn>;
const mockGet = getLabs as ReturnType<typeof vi.fn>;

const NOW = '2026-03-22T10:00:00.000Z';
const mockLab = {
  id: 'l-1',
  userId: 'test-user-id',
  date: new Date(NOW),
  uricAcidLevel: 6.5,
  notes: null,
  createdAt: new Date(NOW),
  updatedAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/labs', () => {
  it('returns 200 with lab list', async () => {
    mockGet.mockResolvedValue([mockLab]);
    const req = new NR('http://localhost/api/labs');

    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('test-user-id', {});
  });

  it('passes date range query params to service', async () => {
    mockGet.mockResolvedValue([]);
    const req = new NR(`http://localhost/api/labs?from=${NOW}&to=${NOW}`);

    await GET(req, { params: Promise.resolve({}) });

    expect(mockGet).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ from: NOW, to: NOW }),
    );
  });

  it('returns 400 when query params fail validation', async () => {
    const req = new NR('http://localhost/api/labs?from=not-a-date');

    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe('POST /api/labs', () => {
  it('returns 201 with created lab result', async () => {
    mockCreate.mockResolvedValue(mockLab);
    const req = new NR('http://localhost/api/labs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: NOW, uricAcidLevel: 6.5 }),
    });

    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.uricAcidLevel).toBe(6.5);
  });

  it('returns 400 when body fails validation', async () => {
    const req = new NR('http://localhost/api/labs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uricAcidLevel: -1 }),
    });

    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});
