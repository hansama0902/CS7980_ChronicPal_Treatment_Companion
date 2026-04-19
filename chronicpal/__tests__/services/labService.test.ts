import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLab, getLabs } from '@/services/labService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    labResult: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as unknown as {
  labResult: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

const USER_ID = 'user-1';
const LAB_ID = 'lab-1';
const NOW = new Date('2026-03-22T10:00:00.000Z');

const mockRecord = {
  id: LAB_ID,
  userId: USER_ID,
  date: NOW,
  uricAcidLevel: 6.2,
  notes: 'Routine draw',
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createLab', () => {
  it('creates and returns a lab result', async () => {
    mockPrisma.labResult.create.mockResolvedValue(mockRecord);

    const result = await createLab(USER_ID, {
      date: NOW.toISOString(),
      uricAcidLevel: 6.2,
      notes: 'Routine draw',
    });

    expect(mockPrisma.labResult.create).toHaveBeenCalledOnce();
    expect(result.id).toBe(LAB_ID);
    expect(result.uricAcidLevel).toBe(6.2);
  });

  it('persists the userId from the caller, not the request body', async () => {
    mockPrisma.labResult.create.mockResolvedValue(mockRecord);

    await createLab(USER_ID, { date: NOW.toISOString(), uricAcidLevel: 5.0 });

    const callArg = mockPrisma.labResult.create.mock.calls[0][0] as {
      data: { userId: string };
    };
    expect(callArg.data.userId).toBe(USER_ID);
  });

  it('sets notes to null when omitted', async () => {
    mockPrisma.labResult.create.mockResolvedValue({ ...mockRecord, notes: null });

    const result = await createLab(USER_ID, { date: NOW.toISOString(), uricAcidLevel: 5.0 });

    const callArg = mockPrisma.labResult.create.mock.calls[0][0] as {
      data: { notes: null };
    };
    expect(callArg.data.notes).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('stores date as a Date object', async () => {
    mockPrisma.labResult.create.mockResolvedValue(mockRecord);

    await createLab(USER_ID, { date: NOW.toISOString(), uricAcidLevel: 6.2 });

    const callArg = mockPrisma.labResult.create.mock.calls[0][0] as {
      data: { date: Date };
    };
    expect(callArg.data.date).toBeInstanceOf(Date);
    expect(callArg.data.date).toEqual(NOW);
  });
});

describe('getLabs', () => {
  it('returns all lab results for a user ordered by date asc', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([mockRecord]);

    const result = await getLabs(USER_ID, {});

    expect(mockPrisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, orderBy: { date: 'asc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('returns an empty array when no lab results exist', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([]);

    const result = await getLabs(USER_ID, {});

    expect(result).toEqual([]);
  });

  it('applies date range filter when from/to are provided', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([]);

    await getLabs(USER_ID, {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-22T00:00:00.000Z',
    });

    const callArg = mockPrisma.labResult.findMany.mock.calls[0][0] as {
      where: { date: { gte: Date; lte: Date } };
    };
    expect(callArg.where.date.gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(callArg.where.date.lte).toEqual(new Date('2026-03-22T00:00:00.000Z'));
  });

  it('applies only from filter when only from is provided', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([]);

    await getLabs(USER_ID, { from: '2026-01-01T00:00:00.000Z' });

    const callArg = mockPrisma.labResult.findMany.mock.calls[0][0] as {
      where: { date?: { gte?: Date; lte?: Date } };
    };
    expect(callArg.where.date?.gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(callArg.where.date?.lte).toBeUndefined();
  });

  it('applies only to filter when only to is provided', async () => {
    mockPrisma.labResult.findMany.mockResolvedValue([]);

    await getLabs(USER_ID, { to: '2026-03-22T00:00:00.000Z' });

    const callArg = mockPrisma.labResult.findMany.mock.calls[0][0] as {
      where: { date?: { gte?: Date; lte?: Date } };
    };
    expect(callArg.where.date?.lte).toEqual(new Date('2026-03-22T00:00:00.000Z'));
    expect(callArg.where.date?.gte).toBeUndefined();
  });

  it('returns results sorted by date ascending (oldest first)', async () => {
    const older = { ...mockRecord, id: 'lab-0', date: new Date('2026-01-01') };
    const newer = { ...mockRecord, id: 'lab-2', date: new Date('2026-03-01') };
    mockPrisma.labResult.findMany.mockResolvedValue([older, newer]);

    const result = await getLabs(USER_ID, {});

    expect(result[0].id).toBe('lab-0');
    expect(result[1].id).toBe('lab-2');
  });
});
