import { prisma } from '@/lib/prisma';
import { ICreateLabDto, ILabQuery, ILabResult, IUpdateLabDto } from '@/types/lab';
import { NotFoundError } from '@/lib/errors';

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
 * Updates a lab result. Verifies ownership before updating.
 * Throws NotFoundError if the entry does not exist or belongs to another user.
 */
export async function updateLab(
  userId: string,
  id: string,
  dto: IUpdateLabDto,
): Promise<ILabResult> {
  const existing = await prisma.labResult.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Lab result not found');
  }

  const record = await prisma.labResult.update({
    where: { id },
    data: {
      ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      ...(dto.uricAcidLevel !== undefined ? { uricAcidLevel: dto.uricAcidLevel } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    },
  });
  return toLabResult(record);
}

/**
 * Deletes a lab result. Verifies ownership before deleting.
 * Throws NotFoundError if the entry does not exist or belongs to another user.
 */
export async function deleteLab(userId: string, id: string): Promise<void> {
  const existing = await prisma.labResult.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Lab result not found');
  }
  await prisma.labResult.delete({ where: { id } });
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
