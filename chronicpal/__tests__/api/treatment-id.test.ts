import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/routeAuth', () => ({
  withAuth: (handler: any) => async (req: any, ctx?: any) => {
    const params = ctx?.params ? await ctx.params : {};
    return handler('test-user-id', req, params);
  },
}));

vi.mock('@/services/treatmentService', () => ({
  updateTreatment: vi.fn(),
  deleteTreatment: vi.fn(),
}));

import { updateTreatment, deleteTreatment } from '@/services/treatmentService';
import { DELETE, PUT } from '@/app/api/treatments/[id]/route';

const mockUpdate = updateTreatment as ReturnType<typeof vi.fn>;
const mockDelete = deleteTreatment as ReturnType<typeof vi.fn>;

const NOW = '2026-03-22T10:00:00.000Z';
const mockTreatment = {
  id: 't-1',
  userId: 'test-user-id',
  date: new Date(NOW),
  type: 'INFUSION',
  uricAcidLevel: 5.2,
  painScore: null,
  notes: null,
  createdAt: new Date(NOW),
  updatedAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/treatments/[id]', () => {
  it('returns 200 with updated treatment', async () => {
    mockUpdate.mockResolvedValue(mockTreatment);
    const req = new Request('http://localhost/api/treatments/t-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uricAcidLevel: 5.2 }),
    });

    const res = await PUT(req as any, { params: Promise.resolve({ id: 't-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith('test-user-id', 't-1', { uricAcidLevel: 5.2 });
  });

  it('returns 400 when body is invalid', async () => {
    const req = new Request('http://localhost/api/treatments/t-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'BadType' }),
    });

    const res = await PUT(req as any, { params: Promise.resolve({ id: 't-1' }) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe('DELETE /api/treatments/[id]', () => {
  it('returns 200 on successful deletion', async () => {
    mockDelete.mockResolvedValue(undefined);
    const req = new Request('http://localhost/api/treatments/t-1', { method: 'DELETE' });

    const res = await DELETE(req as any, { params: Promise.resolve({ id: 't-1' }) });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('test-user-id', 't-1');
  });
});
