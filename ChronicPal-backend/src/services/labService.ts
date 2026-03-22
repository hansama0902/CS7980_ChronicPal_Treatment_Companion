import prisma from '../prisma/client';
import { ICreateLabDto, ILabQuery, ILabResult } from '../types/lab';

/**
 * Maps a Prisma LabResult record to the domain ILabResult interface.
 */
function toLabResult(record: {
  id: string;
  userId: string;
  date: Date;
  uricAcidLevel: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ILabResult {
  return {
    id: record.id,
    userId: record.userId,
    date: record.date,
    uricAcidLevel: record.uricAcidLevel,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Creates a new lab result for the given user.
 */
export async function createLab(userId: string, dto: ICreateLabDto): Promise<ILabResult> {
  const record = await prisma.labResult.create({
    data: {
      userId,
      date: new Date(dto.date),
      uricAcidLevel: dto.uricAcidLevel,
      notes: dto.notes ?? null,
    },
  });
  return toLabResult(record);
}

/**
 * Returns all lab results for a user, ordered by date ascending.
 * Optionally filtered by date range.
 */
export async function getLabs(userId: string, query: ILabQuery): Promise<ILabResult[]> {
  const records = await prisma.labResult.findMany({
    where: {
      userId,
      ...(query.from !== undefined || query.to !== undefined
        ? {
            date: {
              ...(query.from !== undefined ? { gte: new Date(query.from) } : {}),
              ...(query.to !== undefined ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: 'asc' },
  });
  return records.map(toLabResult);
}
