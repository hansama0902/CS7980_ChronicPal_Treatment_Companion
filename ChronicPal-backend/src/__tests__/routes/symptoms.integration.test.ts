import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../index';

// Mock the Prisma client
vi.mock('../../prisma/client', () => ({
  default: {
    symptomEntry: {
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
  symptomEntry: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const AUTH_HEADER = { Authorization: 'Bearer mock-token' };
const NOW = new Date('2026-03-22T10:00:00.000Z');
const ENTRY_ID = 'symptom-1';

const mockEntry = {
  id: ENTRY_ID,
  userId: 'user-1',
  date: NOW,
  symptomType: 'joint_pain',
  severity: 6,
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('GET /api/symptoms', () => {
  it('returns 200 with entries for authenticated user', async () => {
    mockPrisma.symptomEntry.findMany.mockResolvedValue([mockEntry]);

    const res = await request(app).get('/api/symptoms').set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].symptomType).toBe('joint_pain');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/symptoms');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await request(app)
      .get('/api/symptoms?from=not-a-date')
      .set(AUTH_HEADER);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/symptoms', () => {
  it('creates and returns a symptom entry with 201', async () => {
    mockPrisma.symptomEntry.create.mockResolvedValue(mockEntry);

    const res = await request(app)
      .post('/api/symptoms')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), symptomType: 'joint_pain', severity: 6 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.symptomType).toBe('joint_pain');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set(AUTH_HEADER)
      .send({ severity: 5 }); // missing date and symptomType

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when severity is out of range', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), symptomType: 'joint_pain', severity: 11 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when severity is below minimum', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set(AUTH_HEADER)
      .send({ date: NOW.toISOString(), symptomType: 'joint_pain', severity: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .send({ date: NOW.toISOString(), symptomType: 'joint_pain', severity: 5 });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/symptoms/:id', () => {
  it('updates and returns the entry', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(mockEntry);
    mockPrisma.symptomEntry.update.mockResolvedValue({ ...mockEntry, severity: 8 });

    const res = await request(app)
      .put(`/api/symptoms/${ENTRY_ID}`)
      .set(AUTH_HEADER)
      .send({ severity: 8 });

    expect(res.status).toBe(200);
    expect(res.body.data.severity).toBe(8);
  });

  it('returns 404 when entry does not exist', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/symptoms/${ENTRY_ID}`)
      .set(AUTH_HEADER)
      .send({ severity: 5 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid update payload', async () => {
    const res = await request(app)
      .put(`/api/symptoms/${ENTRY_ID}`)
      .set(AUTH_HEADER)
      .send({ severity: -1 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/symptoms/:id', () => {
  it('deletes the entry and returns 200', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(mockEntry);
    mockPrisma.symptomEntry.delete.mockResolvedValue(mockEntry);

    const res = await request(app).delete(`/api/symptoms/${ENTRY_ID}`).set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when entry does not exist', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(null);

    const res = await request(app).delete(`/api/symptoms/${ENTRY_ID}`).set(AUTH_HEADER);

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).delete(`/api/symptoms/${ENTRY_ID}`);
    expect(res.status).toBe(401);
  });
});
