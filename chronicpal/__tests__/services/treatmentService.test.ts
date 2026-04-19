import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TreatmentType } from '@/types/treatment';
import {
  createTreatment,
  deleteTreatment,
  getTreatments,
  updateTreatment,
} from '@/services/treatmentService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    treatmentEntry: {
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
  treatmentEntry: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const USER_ID = 'user-1';
const ENTRY_ID = 'entry-1';
const NOW = new Date('2026-03-22T10:00:00.000Z');

const mockRecord = {
  id: ENTRY_ID,
  userId: USER_ID,
  date: NOW,
  type: 'INFUSION',
  uricAcidLevel: 6.2,
  painScore: 3,
  notes: 'Test note',
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTreatment', () => {
  it('creates and returns a treatment entry', async () => {
    mockPrisma.treatmentEntry.create.mockResolvedValue(mockRecord);

    const result = await createTreatment(USER_ID, {
      date: NOW.toISOString(),
      type: TreatmentType.INFUSION,
      uricAcidLevel: 6.2,
      painScore: 3,
      notes: 'Test note',
    });

    expect(mockPrisma.treatmentEntry.create).toHaveBeenCalledOnce();
    expect(result.id).toBe(ENTRY_ID);
    expect(result.type).toBe(TreatmentType.INFUSION);
    expect(result.uricAcidLevel).toBe(6.2);
  });

  it('sets optional fields to null when omitted', async () => {
    mockPrisma.treatmentEntry.create.mockResolvedValue({
      ...mockRecord,
      uricAcidLevel: null,
      painScore: null,
      notes: null,
    });

    const result = await createTreatment(USER_ID, {
      date: NOW.toISOString(),
      type: TreatmentType.MEDICATION,
    });

    const callArg = mockPrisma.treatmentEntry.create.mock.calls[0][0] as {
      data: { uricAcidLevel: null; painScore: null; notes: null };
    };
    expect(callArg.data.uricAcidLevel).toBeNull();
    expect(callArg.data.painScore).toBeNull();
    expect(callArg.data.notes).toBeNull();
    expect(result.uricAcidLevel).toBeNull();
  });
});

describe('getTreatments', () => {
  it('returns all entries for a user ordered by date desc', async () => {
    mockPrisma.treatmentEntry.findMany.mockResolvedValue([mockRecord]);

    const result = await getTreatments(USER_ID, {});

    expect(mockPrisma.treatmentEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, orderBy: { date: 'desc' } }),
    );
    expect(result).toHaveLength(1);
  });

  it('applies date range filter when from/to are provided', async () => {
    mockPrisma.treatmentEntry.findMany.mockResolvedValue([]);

    await getTreatments(USER_ID, {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-03-22T00:00:00.000Z',
    });

    const callArg = mockPrisma.treatmentEntry.findMany.mock.calls[0][0] as {
      where: { date: { gte: Date; lte: Date } };
    };
    expect(callArg.where.date.gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(callArg.where.date.lte).toEqual(new Date('2026-03-22T00:00:00.000Z'));
  });

  it('applies only to filter when from is omitted', async () => {
    mockPrisma.treatmentEntry.findMany.mockResolvedValue([]);

    await getTreatments(USER_ID, { to: '2026-03-22T00:00:00.000Z' });

    const callArg = mockPrisma.treatmentEntry.findMany.mock.calls[0][0] as {
      where: { date?: { gte?: Date; lte?: Date } };
    };
    expect(callArg.where.date?.lte).toEqual(new Date('2026-03-22T00:00:00.000Z'));
    expect(callArg.where.date?.gte).toBeUndefined();
  });

  it('returns an empty array when no entries exist', async () => {
    mockPrisma.treatmentEntry.findMany.mockResolvedValue([]);
    const result = await getTreatments(USER_ID, {});
    expect(result).toEqual([]);
  });
});

describe('updateTreatment', () => {
  it('updates and returns the entry when it exists and is owned', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.treatmentEntry.update.mockResolvedValue({ ...mockRecord, painScore: 7 });

    const result = await updateTreatment(USER_ID, ENTRY_ID, { painScore: 7 });

    expect(result.painScore).toBe(7);
    expect(mockPrisma.treatmentEntry.update).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when entry does not exist', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(null);

    await expect(updateTreatment(USER_ID, ENTRY_ID, { painScore: 7 })).rejects.toThrow(
      'Treatment entry not found',
    );
    expect(mockPrisma.treatmentEntry.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when entry belongs to another user', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(null);

    await expect(updateTreatment('other-user', ENTRY_ID, {})).rejects.toThrow(
      'Treatment entry not found',
    );
  });

  it('updates all optional fields when full dto is provided', async () => {
    const updated = { ...mockRecord, type: 'MEDICATION', uricAcidLevel: 5.5, notes: 'Updated' };
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.treatmentEntry.update.mockResolvedValue(updated);

    const result = await updateTreatment(USER_ID, ENTRY_ID, {
      date: NOW.toISOString(),
      type: TreatmentType.MEDICATION,
      uricAcidLevel: 5.5,
      painScore: 2,
      notes: 'Updated',
    });

    const callArg = mockPrisma.treatmentEntry.update.mock.calls[0][0] as {
      data: { date: Date; type: string; uricAcidLevel: number; painScore: number; notes: string };
    };
    expect(callArg.data.date).toBeInstanceOf(Date);
    expect(callArg.data.type).toBe(TreatmentType.MEDICATION);
    expect(callArg.data.uricAcidLevel).toBe(5.5);
    expect(callArg.data.painScore).toBe(2);
    expect(callArg.data.notes).toBe('Updated');
    expect(result.type).toBe('MEDICATION');
  });
});

describe('deleteTreatment', () => {
  it('deletes the entry when it exists and is owned', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.treatmentEntry.delete.mockResolvedValue(mockRecord);

    await expect(deleteTreatment(USER_ID, ENTRY_ID)).resolves.toBeUndefined();
    expect(mockPrisma.treatmentEntry.delete).toHaveBeenCalledWith({ where: { id: ENTRY_ID } });
  });

  it('throws NotFoundError when entry does not exist', async () => {
    mockPrisma.treatmentEntry.findFirst.mockResolvedValue(null);

    await expect(deleteTreatment(USER_ID, ENTRY_ID)).rejects.toThrow('Treatment entry not found');
    expect(mockPrisma.treatmentEntry.delete).not.toHaveBeenCalled();
  });
});
