import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSymptom,
  deleteSymptom,
  getSymptoms,
  updateSymptom,
} from '@/services/symptomService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    symptomEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as unknown as {
  symptomEntry: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const USER_ID = 'user-1';
const ENTRY_ID = 'symptom-1';
const NOW = new Date('2026-03-22T10:00:00.000Z');

const mockRecord = {
  id: ENTRY_ID,
  userId: USER_ID,
  date: NOW,
  symptomType: 'Joint pain',
  severity: 5,
  notes: 'Mild swelling',
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createSymptom', () => {
  it('creates and returns a symptom entry', async () => {
    mockPrisma.symptomEntry.create.mockResolvedValue(mockRecord);

    const result = await createSymptom(USER_ID, {
      date: NOW.toISOString(),
      symptomType: 'Joint pain',
      severity: 5,
      notes: 'Mild swelling',
    });

    expect(mockPrisma.symptomEntry.create).toHaveBeenCalledOnce();
    expect(result.id).toBe(ENTRY_ID);
    expect(result.symptomType).toBe('Joint pain');
    expect(result.severity).toBe(5);
  });

  it('uses the caller userId, not from the dto', async () => {
    mockPrisma.symptomEntry.create.mockResolvedValue(mockRecord);

    await createSymptom(USER_ID, {
      date: NOW.toISOString(),
      symptomType: 'Fatigue',
      severity: 3,
    });

    const callArg = mockPrisma.symptomEntry.create.mock.calls[0][0] as {
      data: { userId: string };
    };
    expect(callArg.data.userId).toBe(USER_ID);
  });

  it('sets notes to null when omitted', async () => {
    mockPrisma.symptomEntry.create.mockResolvedValue({ ...mockRecord, notes: null });

    const result = await createSymptom(USER_ID, {
      date: NOW.toISOString(),
      symptomType: 'Fatigue',
      severity: 3,
    });

    const callArg = mockPrisma.symptomEntry.create.mock.calls[0][0] as {
      data: { notes: null };
    };
    expect(callArg.data.notes).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('stores date as a Date object', async () => {
    mockPrisma.symptomEntry.create.mockResolvedValue(mockRecord);

    await createSymptom(USER_ID, {
      date: NOW.toISOString(),
      symptomType: 'Pain',
      severity: 4,
    });

    const callArg = mockPrisma.symptomEntry.create.mock.calls[0][0] as {
      data: { date: Date };
    };
    expect(callArg.data.date).toBeInstanceOf(Date);
  });
});

describe('getSymptoms', () => {
  it('returns all entries for a user ordered by date desc', async () => {
    mockPrisma.symptomEntry.findMany.mockResolvedValue([mockRecord]);

    const result = await getSymptoms(USER_ID, {});

    expect(mockPrisma.symptomEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, orderBy: { date: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('returns an empty array when no entries exist', async () => {
    mockPrisma.symptomEntry.findMany.mockResolvedValue([]);
    const result = await getSymptoms(USER_ID, {});
    expect(result).toEqual([]);
  });

  it('applies date range filter when from/to are provided', async () => {
    mockPrisma.symptomEntry.findMany.mockResolvedValue([]);

    await getSymptoms(USER_ID, {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-22T00:00:00.000Z',
    });

    const callArg = mockPrisma.symptomEntry.findMany.mock.calls[0][0] as {
      where: { date: { gte: Date; lte: Date } };
    };
    expect(callArg.where.date.gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(callArg.where.date.lte).toEqual(new Date('2026-03-22T00:00:00.000Z'));
  });

  it('applies only from filter when to is omitted', async () => {
    mockPrisma.symptomEntry.findMany.mockResolvedValue([]);

    await getSymptoms(USER_ID, { from: '2026-01-01T00:00:00.000Z' });

    const callArg = mockPrisma.symptomEntry.findMany.mock.calls[0][0] as {
      where: { date: { gte: Date; lte?: Date } };
    };
    expect(callArg.where.date.gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(callArg.where.date.lte).toBeUndefined();
  });

  it('applies only to filter when from is omitted', async () => {
    mockPrisma.symptomEntry.findMany.mockResolvedValue([]);

    await getSymptoms(USER_ID, { to: '2026-03-22T00:00:00.000Z' });

    const callArg = mockPrisma.symptomEntry.findMany.mock.calls[0][0] as {
      where: { date: { gte?: Date; lte: Date } };
    };
    expect(callArg.where.date.lte).toEqual(new Date('2026-03-22T00:00:00.000Z'));
    expect(callArg.where.date.gte).toBeUndefined();
  });
});

describe('updateSymptom', () => {
  it('updates and returns the entry when it exists and is owned', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.symptomEntry.update.mockResolvedValue({ ...mockRecord, severity: 8 });

    const result = await updateSymptom(USER_ID, ENTRY_ID, { severity: 8 });

    expect(result.severity).toBe(8);
    expect(mockPrisma.symptomEntry.update).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when entry does not exist', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(null);

    await expect(updateSymptom(USER_ID, ENTRY_ID, { severity: 5 })).rejects.toThrow(
      'Symptom entry not found',
    );
    expect(mockPrisma.symptomEntry.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when entry belongs to another user', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(null);

    await expect(updateSymptom('other-user', ENTRY_ID, {})).rejects.toThrow(
      'Symptom entry not found',
    );
  });

  it('updates all optional fields when all dto fields are provided', async () => {
    const updated = { ...mockRecord, symptomType: 'Nausea', severity: 7, notes: 'Updated' };
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.symptomEntry.update.mockResolvedValue(updated);

    const result = await updateSymptom(USER_ID, ENTRY_ID, {
      date: NOW.toISOString(),
      symptomType: 'Nausea',
      severity: 7,
      notes: 'Updated',
    });

    const callArg = mockPrisma.symptomEntry.update.mock.calls[0][0] as {
      data: { date: Date; symptomType: string; severity: number; notes: string };
    };
    expect(callArg.data.date).toBeInstanceOf(Date);
    expect(callArg.data.symptomType).toBe('Nausea');
    expect(callArg.data.severity).toBe(7);
    expect(callArg.data.notes).toBe('Updated');
    expect(result.symptomType).toBe('Nausea');
  });
});

describe('deleteSymptom', () => {
  it('deletes the entry when it exists and is owned', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.symptomEntry.delete.mockResolvedValue(mockRecord);

    await expect(deleteSymptom(USER_ID, ENTRY_ID)).resolves.toBeUndefined();
    expect(mockPrisma.symptomEntry.delete).toHaveBeenCalledWith({ where: { id: ENTRY_ID } });
  });

  it('throws NotFoundError when entry does not exist', async () => {
    mockPrisma.symptomEntry.findFirst.mockResolvedValue(null);

    await expect(deleteSymptom(USER_ID, ENTRY_ID)).rejects.toThrow('Symptom entry not found');
    expect(mockPrisma.symptomEntry.delete).not.toHaveBeenCalled();
  });
});
