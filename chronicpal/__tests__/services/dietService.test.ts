import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDietEntry, getDietEntries } from '@/services/dietService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dietEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as unknown as {
  dietEntry: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

const USER_ID = 'user-1';
const NOW = new Date('2026-04-19T10:00:00.000Z');
const NOW_ISO = NOW.toISOString();

const mockRecord = {
  id: 'd-1',
  userId: USER_ID,
  meal: 'Chicken breast',
  mealType: 'LUNCH',
  purineLevel: 'LOW',
  riskScore: null,
  aiAnalysis: null,
  date: NOW,
  createdAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createDietEntry', () => {
  it('creates and returns a diet entry', async () => {
    mockPrisma.dietEntry.create.mockResolvedValue(mockRecord);
    const result = await createDietEntry(USER_ID, {
      meal: 'Chicken breast',
      mealType: 'LUNCH',
      date: NOW_ISO,
    });
    expect(mockPrisma.dietEntry.create).toHaveBeenCalledOnce();
    expect(result.id).toBe('d-1');
    expect(result.mealType).toBe('LUNCH');
    expect(result.purineLevel).toBe('LOW');
  });

  it('persists userId from the caller, not from the request body', async () => {
    mockPrisma.dietEntry.create.mockResolvedValue(mockRecord);
    await createDietEntry(USER_ID, { meal: 'Eggs', mealType: 'BREAKFAST', date: NOW_ISO });
    const arg = mockPrisma.dietEntry.create.mock.calls[0][0] as { data: { userId: string } };
    expect(arg.data.userId).toBe(USER_ID);
  });

  it('stores date as a Date object', async () => {
    mockPrisma.dietEntry.create.mockResolvedValue(mockRecord);
    await createDietEntry(USER_ID, { meal: 'Eggs', mealType: 'BREAKFAST', date: NOW_ISO });
    const arg = mockPrisma.dietEntry.create.mock.calls[0][0] as { data: { date: Date } };
    expect(arg.data.date).toBeInstanceOf(Date);
    expect(arg.data.date).toEqual(NOW);
  });

  it('sets default purineLevel to LOW for manual entries', async () => {
    mockPrisma.dietEntry.create.mockResolvedValue(mockRecord);
    await createDietEntry(USER_ID, { meal: 'Eggs', mealType: 'BREAKFAST', date: NOW_ISO });
    const arg = mockPrisma.dietEntry.create.mock.calls[0][0] as { data: { purineLevel: string } };
    expect(arg.data.purineLevel).toBe('LOW');
  });
});

describe('getDietEntries', () => {
  it('returns all diet entries ordered by date descending', async () => {
    mockPrisma.dietEntry.findMany.mockResolvedValue([mockRecord]);
    const result = await getDietEntries(USER_ID, {});
    expect(mockPrisma.dietEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, orderBy: { date: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no entries exist', async () => {
    mockPrisma.dietEntry.findMany.mockResolvedValue([]);
    const result = await getDietEntries(USER_ID, {});
    expect(result).toEqual([]);
  });

  it('applies date range filter when from and to are provided', async () => {
    mockPrisma.dietEntry.findMany.mockResolvedValue([]);
    await getDietEntries(USER_ID, { from: NOW_ISO, to: NOW_ISO });
    const arg = mockPrisma.dietEntry.findMany.mock.calls[0][0] as {
      where: { date: { gte: Date; lte: Date } };
    };
    expect(arg.where.date.gte).toEqual(NOW);
    expect(arg.where.date.lte).toEqual(NOW);
  });

  it('applies only from filter when only from is provided', async () => {
    mockPrisma.dietEntry.findMany.mockResolvedValue([]);
    await getDietEntries(USER_ID, { from: NOW_ISO });
    const arg = mockPrisma.dietEntry.findMany.mock.calls[0][0] as {
      where: { date?: { gte?: Date; lte?: Date } };
    };
    expect(arg.where.date?.gte).toEqual(NOW);
    expect(arg.where.date?.lte).toBeUndefined();
  });

  it('applies only to filter when only to is provided', async () => {
    mockPrisma.dietEntry.findMany.mockResolvedValue([]);
    await getDietEntries(USER_ID, { to: NOW_ISO });
    const arg = mockPrisma.dietEntry.findMany.mock.calls[0][0] as {
      where: { date?: { gte?: Date; lte?: Date } };
    };
    expect(arg.where.date?.lte).toEqual(NOW);
    expect(arg.where.date?.gte).toBeUndefined();
  });

  it('returns results with correct shape including optional fields', async () => {
    mockPrisma.dietEntry.findMany.mockResolvedValue([mockRecord]);
    const [entry] = await getDietEntries(USER_ID, {});
    expect(entry.id).toBe('d-1');
    expect(entry.meal).toBe('Chicken breast');
    expect(entry.riskScore).toBeNull();
    expect(entry.aiAnalysis).toBeNull();
  });
});
