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
  updateLab: vi.fn(),
  deleteLab: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { updateLab, deleteLab } from '@/services/labService';
import { PUT, DELETE } from '@/app/api/labs/[id]/route';

const mockUpdate = updateLab as ReturnType<typeof vi.fn>;
const mockDelete = deleteLab as ReturnType<typeof vi.fn>;

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

describe('PUT /api/labs/[id]', () => {
  it('returns 200 with updated lab result', async () => {
    mockUpdate.mockResolvedValue({ ...mockLab, uricAcidLevel: 5.9 });
    const req = new NR('http://localhost/api/labs/l-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uricAcidLevel: 5.9 }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'l-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith('test-user-id', 'l-1', { uricAcidLevel: 5.9 });
  });

  it('returns 400 when body fails validation', async () => {
    const req = new NR('http://localhost/api/labs/l-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uricAcidLevel: -5 }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'l-1' }) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('returns 400 when date is invalid ISO string', async () => {
    const req = new NR('http://localhost/api/labs/l-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: 'not-a-date' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'l-1' }) });

    expect(res.status).toBe(400);
  });

  it('passes the route param id to the service', async () => {
    mockUpdate.mockResolvedValue(mockLab);
    const req = new NR('http://localhost/api/labs/l-99', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'updated' }),
    });

    await PUT(req, { params: Promise.resolve({ id: 'l-99' }) });

    expect(mockUpdate).toHaveBeenCalledWith('test-user-id', 'l-99', { notes: 'updated' });
  });
});

describe('DELETE /api/labs/[id]', () => {
  it('returns 200 on successful deletion', async () => {
    mockDelete.mockResolvedValue(undefined);
    const req = new NR('http://localhost/api/labs/l-1', { method: 'DELETE' });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'l-1' }) });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('test-user-id', 'l-1');
  });

  it('passes the correct id to the service', async () => {
    mockDelete.mockResolvedValue(undefined);
    const req = new NR('http://localhost/api/labs/l-42', { method: 'DELETE' });

    await DELETE(req, { params: Promise.resolve({ id: 'l-42' }) });

    expect(mockDelete).toHaveBeenCalledWith('test-user-id', 'l-42');
  });
});
