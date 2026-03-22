import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../index';

// Mock the Prisma client
vi.mock('../../prisma/client', () => ({
  default: {
    labResult: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock JWT verification so tests don't need real tokens.
// Must override `default` for ESM interop — auth.ts uses `import jwt from 'jsonwebtoken'`.
vi.mock('jsonwebtoken', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jsonwebtoken')>();
  const mocked = {
    ...actual,
    verify: vi.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
    sign: vi.fn().mockReturnValue('mock-token'),
  };
  return { ...mocked, default: mocked };
});

import prisma from '../../prisma/client';

const mockPrisma = prisma as {
  labResult: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

const AUTH_HEADER = { Authorization: 'Bearer mock-token' };
const NOW = new Date('2026-03-22T10:00:00.000Z');
const LAB_ID = 'lab-1';

const mockLabRecord = {
  id: LAB_ID,
  userId: 'user-1',
  date: NOW,
  uricAcidLevel: 6.2,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('POST /api/labs', () => {
  it('creates and returns a lab entry with 201', async () => {
    mockPrisma.labResult.create.mockResolvedValue(mockLabRecord);

    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), uricAcidLevel: 6.2 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uricAcidLevel).toBe(6.2);
    expect(res.body.data.id).toBe(LAB_ID);
  });

  it('persists the uric acid level and date supplied by the user', async () => {
    mockPrisma.labResult.create.mockResolvedValue(mockLabRecord);

    await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), uricAcidLevel: 6.2 });

    expect(mockPrisma.labResult.create).toHaveBeenCalledOnce();
    const callArg = mockPrisma.labResult.create.mock.calls[0][0] as {
      data: { uricAcidLevel: number; date: Date };
    };
    expect(callArg.data.uricAcidLevel).toBe(6.2);
    expect(callArg.data.date).toEqual(NOW);
  });

  it('returns 400 when date is missing', async () => {
    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ uricAcidLevel: 6.2 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when uricAcidLevel is missing', async () => {
    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when uricAcidLevel is negative', async () => {
    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), uricAcidLevel: -1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when uricAcidLevel exceeds 20', async () => {
    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), uricAcidLevel: 20.1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when uricAcidLevel is 0', async () => {
    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), uricAcidLevel: 0 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/labs')
      .send({ date: NOW.toISOString(), uricAcidLevel: 6.2 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('accepts an optional notes field', async () => {
    mockPrisma.labResult.create.mockResolvedValue({ ...mockLabRecord, notes: 'Morning draw' });

    const res = await request(app)
      .post('/api/labs')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), uricAcidLevel: 6.2, notes: 'Morning draw' });

    expect(res.status).toBe(201);
    expect(res.body.data.notes).toBe('Morning draw');
  });
});

describe('GET /api/labs', () => {
  it('returns 200 with lab entries for authenticated user', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([mockLabRecord]);

    const res = await request(app).get('/api/labs').set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns entries sorted by date ascending', async () => {
    const older = { ...mockLabRecord, id: 'lab-0', date: new Date('2026-01-01T00:00:00.000Z') };
    const newer = { ...mockLabRecord, id: 'lab-2', date: new Date('2026-03-01T00:00:00.000Z') };
    mockPrisma.labResult.findMany.mockResolvedValue([older, newer]);

    const res = await request(app).get('/api/labs').set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe('lab-0');
    expect(res.body.data[1].id).toBe('lab-2');
  });

  it('returns an empty array when the user has no lab results', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/labs').set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/labs');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await request(app)
      .get('/api/labs?from=not-a-date')
      .set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('scopes results to the authenticated user only', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([mockLabRecord]);

    await request(app).get('/api/labs').set(AUTH_HEADER);

    const callArg = mockPrisma.labResult.findMany.mock.calls[0][0] as {
      where: { userId: string };
    };
    expect(callArg.where.userId).toBe('user-1');
  });
});
