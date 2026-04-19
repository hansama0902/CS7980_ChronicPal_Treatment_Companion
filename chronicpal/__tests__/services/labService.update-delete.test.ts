import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateLab, deleteLab } from '@/services/labService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    labResult: {
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
  labResult: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
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

describe('updateLab', () => {
  it('updates and returns the lab result when owned by user', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.labResult.update.mockResolvedValue({ ...mockRecord, uricAcidLevel: 5.8 });

    const result = await updateLab(USER_ID, LAB_ID, { uricAcidLevel: 5.8 });

    expect(result.uricAcidLevel).toBe(5.8);
    expect(mockPrisma.labResult.update).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when lab does not exist', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(null);

    await expect(updateLab(USER_ID, LAB_ID, { uricAcidLevel: 5.8 })).rejects.toThrow(
      'Lab result not found',
    );
    expect(mockPrisma.labResult.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when lab belongs to another user', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(null);

    await expect(updateLab('other-user', LAB_ID, {})).rejects.toThrow('Lab result not found');
  });

  it('updates all provided fields', async () => {
    const updated = { ...mockRecord, uricAcidLevel: 7.1, notes: 'Follow-up' };
    mockPrisma.labResult.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.labResult.update.mockResolvedValue(updated);

    const result = await updateLab(USER_ID, LAB_ID, {
      date: NOW.toISOString(),
      uricAcidLevel: 7.1,
      notes: 'Follow-up',
    });

    const callArg = mockPrisma.labResult.update.mock.calls[0][0] as {
      data: { date: Date; uricAcidLevel: number; notes: string };
    };
    expect(callArg.data.date).toBeInstanceOf(Date);
    expect(callArg.data.uricAcidLevel).toBe(7.1);
    expect(callArg.data.notes).toBe('Follow-up');
    expect(result.notes).toBe('Follow-up');
  });

  it('omits undefined fields from the update payload', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.labResult.update.mockResolvedValue(mockRecord);

    await updateLab(USER_ID, LAB_ID, { notes: 'Updated note' });

    const callArg = mockPrisma.labResult.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(callArg.data.uricAcidLevel).toBeUndefined();
    expect(callArg.data.date).toBeUndefined();
    expect(callArg.data.notes).toBe('Updated note');
  });
});

describe('deleteLab', () => {
  it('deletes the lab result when owned by user', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.labResult.delete.mockResolvedValue(mockRecord);

    await expect(deleteLab(USER_ID, LAB_ID)).resolves.toBeUndefined();
    expect(mockPrisma.labResult.delete).toHaveBeenCalledWith({ where: { id: LAB_ID } });
  });

  it('throws NotFoundError when lab does not exist', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(null);

    await expect(deleteLab(USER_ID, LAB_ID)).rejects.toThrow('Lab result not found');
    expect(mockPrisma.labResult.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when lab belongs to another user', async () => {
    mockPrisma.labResult.findFirst.mockResolvedValue(null);

    await expect(deleteLab('other-user', LAB_ID)).rejects.toThrow('Lab result not found');
    expect(mockPrisma.labResult.delete).not.toHaveBeenCalled();
  });
});
