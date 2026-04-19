import { prisma } from '@/lib/prisma';
import { ICreateDietDto, IDietQuery, IDietResult } from '@/types/diet';

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
 * Returns all diet entries for a user, ordered by date descending.
 * Optionally filtered by date range.
 */
export async function getDietEntries(userId: string, query: IDietQuery): Promise<IDietResult[]> {
  const records = await prisma.dietEntry.findMany({
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
    orderBy: { date: 'desc' },
  });
  return records.map(toDietResult);
}
