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
  softDeleteDietEntry: vi.fn(),
  updateDietEntry: vi.fn(),
}));

import { NextRequest as NR } from 'next/server';
import { softDeleteDietEntry, updateDietEntry } from '@/services/dietService';
import { DELETE, PUT } from '@/app/api/diet/[id]/route';

const mockDelete = softDeleteDietEntry as ReturnType<typeof vi.fn>;
const mockUpdate = updateDietEntry as ReturnType<typeof vi.fn>;

const NOW = '2026-04-19T10:00:00.000Z';
const mockEntry = {
  id: 'd-1',
  userId: 'test-user-id',
  meal: 'Salad',
  mealType: 'LUNCH',
  purineLevel: 'LOW',
  date: new Date(NOW),
};

beforeEach(() => vi.clearAllMocks());

describe('DELETE /api/diet/[id]', () => {
  it('returns 200 and success=true on soft delete', async () => {
    mockDelete.mockResolvedValue(undefined);
    const req = new NR('http://localhost/api/diet/d-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'd-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('test-user-id', 'd-1');
  });
});

describe('PUT /api/diet/[id]', () => {
  it('returns 200 with updated entry on valid body', async () => {
    mockUpdate.mockResolvedValue(mockEntry);
    const req = new NR('http://localhost/api/diet/d-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal: 'Salad', mealType: 'LUNCH', date: NOW }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'd-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.meal).toBe('Salad');
    expect(mockUpdate).toHaveBeenCalledWith(
      'test-user-id',
      'd-1',
      expect.objectContaining({ meal: 'Salad' }),
    );
  });

  it('returns 400 when body fails validation', async () => {
    const req = new NR('http://localhost/api/diet/d-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealType: 'INVALID_TYPE' }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'd-1' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
