import { prisma } from '@/lib/prisma';
import { ICreateDietDto, IDietQuery, IDietResult, IUpdateDietDto } from '@/types/diet';
import { NotFoundError } from '@/lib/errors';

function toDietResult(record: {
  id: string;
  userId: string;
  meal: string;
  mealType: string;
  purineLevel: string;
  riskScore: number | null;
  aiAnalysis: string | null;
  date: Date;
  createdAt: Date;
  deletedAt?: Date | null;
}): IDietResult {
  return {
    id: record.id,
    userId: record.userId,
    meal: record.meal,
    mealType: record.mealType as IDietResult['mealType'],
    purineLevel: record.purineLevel as IDietResult['purineLevel'],
    riskScore: record.riskScore,
    aiAnalysis: record.aiAnalysis,
    date: record.date,
    createdAt: record.createdAt,
  };
}

/**
 * Manually logs a diet entry without AI analysis.
 * Defaults purineLevel to LOW; use the analyze endpoint for AI-assessed risk.
 */
export async function createDietEntry(userId: string, dto: ICreateDietDto): Promise<IDietResult> {
  const record = await prisma.dietEntry.create({
    data: {
      userId,
      meal: dto.meal,
      mealType: dto.mealType,
      purineLevel: 'LOW',
      date: new Date(dto.date),
    },
  });
  return toDietResult(record);
}

/**
 * Returns all non-deleted diet entries for a user, ordered by date descending.
 * Optionally filtered by date range.
 */
export async function getDietEntries(userId: string, query: IDietQuery): Promise<IDietResult[]> {
  const records = await prisma.dietEntry.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(query.from !== undefined || query.to !== undefined
        ? {
            date: {
              ...(query.from !== undefined ? { gte: new Date(query.from) } : {}),
              ...(query.to !== undefined ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: 'desc' },
  });
  return records.map(toDietResult);
}

/**
 * Soft-deletes a diet entry by setting deletedAt.
 * Verifies ownership before deleting.
 */
export async function softDeleteDietEntry(userId: string, id: string): Promise<void> {
  const entry = await prisma.dietEntry.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!entry) throw new NotFoundError('Diet entry not found');
  await prisma.dietEntry.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Updates meal description, type, and date for an existing entry.
 * Verifies ownership and that the entry is not deleted.
 */
export async function updateDietEntry(
  userId: string,
  id: string,
  dto: IUpdateDietDto,
): Promise<IDietResult> {
  const entry = await prisma.dietEntry.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!entry) throw new NotFoundError('Diet entry not found');
  const updated = await prisma.dietEntry.update({
    where: { id },
    data: {
      meal: dto.meal,
      mealType: dto.mealType,
      date: new Date(dto.date),
    },
  });
  return toDietResult(updated);
}
