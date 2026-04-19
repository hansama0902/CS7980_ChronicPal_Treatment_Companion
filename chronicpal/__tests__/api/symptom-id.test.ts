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
  updateSymptom: vi.fn(),
  deleteSymptom: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { updateSymptom, deleteSymptom } from '@/services/symptomService';
import { DELETE, PUT } from '@/app/api/symptoms/[id]/route';

const mockUpdate = updateSymptom as ReturnType<typeof vi.fn>;
const mockDelete = deleteSymptom as ReturnType<typeof vi.fn>;

const NOW = '2026-03-22T10:00:00.000Z';
const mockSymptom = {
  id: 's-1',
  userId: 'test-user-id',
  date: new Date(NOW),
  symptomType: 'Joint pain',
  severity: 7,
  notes: null,
  createdAt: new Date(NOW),
  updatedAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/symptoms/[id]', () => {
  it('returns 200 with updated symptom', async () => {
    mockUpdate.mockResolvedValue(mockSymptom);
    const req = new NR('http://localhost/api/symptoms/s-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity: 7 }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 's-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith('test-user-id', 's-1', { severity: 7 });
  });

  it('returns 400 when body is invalid', async () => {
    const req = new NR('http://localhost/api/symptoms/s-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity: 99 }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 's-1' }) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe('DELETE /api/symptoms/[id]', () => {
  it('returns 200 on successful deletion', async () => {
    mockDelete.mockResolvedValue(undefined);
    const req = new NR('http://localhost/api/symptoms/s-1', { method: 'DELETE' });

    const res = await DELETE(req, { params: Promise.resolve({ id: 's-1' }) });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('test-user-id', 's-1');
  });
});
