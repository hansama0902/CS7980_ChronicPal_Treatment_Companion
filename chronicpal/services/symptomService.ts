import { prisma } from '@/lib/prisma';
import { ICreateSymptomDto, ISymptomEntry, IUpdateSymptomDto } from '@/types/symptom';
import { DateRangeQuery } from '@/validators/shared';
import { NotFoundError } from '@/lib/errors';

/**
 * Maps a Prisma SymptomEntry record to the domain ISymptomEntry interface.
 */
function toSymptomEntry(record: {
  id: string;
  userId: string;
  date: Date;
  symptomType: string;
  severity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ISymptomEntry {
  return {
    id: record.id,
    userId: record.userId,
    date: record.date,
    symptomType: record.symptomType,
    severity: record.severity,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Creates a new symptom entry for the given user.
 */
export async function createSymptom(
  userId: string,
  dto: ICreateSymptomDto,
): Promise<ISymptomEntry> {
  const record = await prisma.symptomEntry.create({
    data: {
      userId,
      date: new Date(dto.date),
      symptomType: dto.symptomType,
      severity: dto.severity,
      notes: dto.notes ?? null,
    },
  });
  return toSymptomEntry(record);
}

/**
 * Returns all symptom entries for a user, ordered by date descending.
 * Optionally filtered by date range.
 */
export async function getSymptoms(
  userId: string,
  query: DateRangeQuery,
): Promise<ISymptomEntry[]> {
  const records = await prisma.symptomEntry.findMany({
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
  return records.map(toSymptomEntry);
}

/**
 * Updates a symptom entry. Verifies ownership before updating.
 * Throws NotFoundError if the entry does not exist or belongs to another user.
 */
export async function updateSymptom(
  userId: string,
  id: string,
  dto: IUpdateSymptomDto,
): Promise<ISymptomEntry> {
  const existing = await prisma.symptomEntry.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Symptom entry not found');
  }

  const record = await prisma.symptomEntry.update({
    where: { id },
    data: {
      ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      ...(dto.symptomType !== undefined ? { symptomType: dto.symptomType } : {}),
      ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    },
  });
  return toSymptomEntry(record);
}

/**
 * Deletes a symptom entry. Verifies ownership before deleting.
 * Throws NotFoundError if the entry does not exist or belongs to another user.
 */
export async function deleteSymptom(userId: string, id: string): Promise<void> {
  const existing = await prisma.symptomEntry.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Symptom entry not found');
  }
  await prisma.symptomEntry.delete({ where: { id } });
}
