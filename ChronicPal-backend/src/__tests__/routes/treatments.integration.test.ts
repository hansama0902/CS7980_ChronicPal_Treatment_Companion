import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../index';
import { TreatmentType } from '../../types/treatment';

// Mock the Prisma client
vi.mock('../../prisma/client', () => ({
  default: {
    treatmentEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock JWT verification so tests don't need real tokens
vi.mock('jsonwebtoken', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jsonwebtoken')>();
  return {
    ...actual,
    verify: vi.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
    sign: vi.fn().mockReturnValue('mock-token'),
  };
});

import prisma from '../../prisma/client';

const mockPrisma = prisma as {
  treatmentEntry: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const AUTH_HEADER = { Authorization: 'Bearer mock-token' };
const NOW = new Date('2026-03-22T10:00:00.000Z');
const ENTRY_ID = 'entry-1';

const mockEntry = {
  id: ENTRY_ID,
  userId: 'user-1',
  date: NOW,
  type: 'INFUSION',
  uricAcidLevel: 6.2,
  painScore: 3,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('GET /api/treatments', () => {
  it('returns 200 with entries for authenticated user', async () => {
    mockPrisma.treatmentEntry.findMany.mockResolvedValue([mockEntry]);

    const res = await request(app).get('/api/treatments').set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/treatments');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await request(app)
      .get('/api/treatments?from=not-a-date')
      .set(AUTH_HEADER);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/treatments', () => {
  it('creates and returns a treatment entry with 201', async () => {
    mockPrisma.treatmentEntry.create.mockResolvedValue(mockEntry);

    const res = await request(app)
      .post('/api/treatments')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), type: TreatmentType.INFUSION, uricAcidLevel: 6.2, painScore: 3 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('INFUSION');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/treatments')
      .set(AUTH_HEADER)
      .send({ uricAcidLevel: 6.2 }); // missing date and type

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when painScore is out of range', async () => {
    const res = await request(app)
      .post('/api/treatments')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), type: TreatmentType.INFUSION, painScore: 11 });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/treatments')
      .send({ date: NOW.toISOString(), type: TreatmentType.INFUSION });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/treatments/:id', () => {
  it('updates and returns the entry', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(mockEntry);
    mockPrisma.treatmentEntry.update.mockResolvedValue({ ...mockEntry, painScore: 7 });

    const res = await request(app)
      .put(`/api/treatments/${ENTRY_ID}`)
      .set(AUTH_HEADER)
      .send({ painScore: 7 });

    expect(res.status).toBe(200);
    expect(res.body.data.painScore).toBe(7);
  });

  it('returns 404 when entry does not exist', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/treatments/${ENTRY_ID}`)
      .set(AUTH_HEADER)
      .send({ painScore: 5 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid update payload', async () => {
    const res = await request(app)
      .put(`/api/treatments/${ENTRY_ID}`)
      .set(AUTH_HEADER)
      .send({ painScore: -5 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/treatments/:id', () => {
  it('deletes the entry and returns 200', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(mockEntry);
    mockPrisma.treatmentEntry.delete.mockResolvedValue(mockEntry);

    const res = await request(app).delete(`/api/treatments/${ENTRY_ID}`).set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when entry does not exist', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(null);

    const res = await request(app).delete(`/api/treatments/${ENTRY_ID}`).set(AUTH_HEADER);

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).delete(`/api/treatments/${ENTRY_ID}`);
    expect(res.status).toBe(401);
  });
});
