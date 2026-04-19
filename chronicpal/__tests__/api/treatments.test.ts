import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/routeAuth', () => ({
  withAuth: (handler: any) => async (req: any, ctx?: any) => {
    const params = ctx?.params ? await ctx.params : {};
    return handler('test-user-id', req, params);
  },
}));

vi.mock('@/services/treatmentService', () => ({
  createTreatment: vi.fn(),
  getTreatments: vi.fn(),
}));

import { createTreatment, getTreatments } from '@/services/treatmentService';
import { GET, POST } from '@/app/api/treatments/route';

const mockCreate = createTreatment as ReturnType<typeof vi.fn>;
const mockGet = getTreatments as ReturnType<typeof vi.fn>;

const NOW = '2026-03-22T10:00:00.000Z';
const mockTreatment = {
  id: 't-1',
  userId: 'test-user-id',
  date: new Date(NOW),
  type: 'INFUSION',
  uricAcidLevel: null,
  painScore: null,
  notes: null,
  createdAt: new Date(NOW),
  updatedAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/treatments', () => {
  it('returns 200 with treatment list', async () => {
    mockGet.mockResolvedValue([mockTreatment]);
    const req = new Request('http://localhost/api/treatments');

    const res = await GET(req as any, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('test-user-id', {});
  });

  it('passes date range query params to service', async () => {
    mockGet.mockResolvedValue([]);
    const req = new Request(`http://localhost/api/treatments?from=${NOW}&to=${NOW}`);

    await GET(req as any, { params: Promise.resolve({}) });

    expect(mockGet).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ from: NOW, to: NOW }),
    );
  });

  it('returns 400 when query params fail validation', async () => {
    const req = new Request('http://localhost/api/treatments?from=bad-date');

    const res = await GET(req as any, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});

describe('POST /api/treatments', () => {
  it('returns 201 with created treatment', async () => {
    mockCreate.mockResolvedValue(mockTreatment);
    const req = new Request('http://localhost/api/treatments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: NOW, type: 'INFUSION' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('INFUSION');
  });

  it('returns 400 when body fails validation', async () => {
    const req = new Request('http://localhost/api/treatments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'InvalidType' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });
});
