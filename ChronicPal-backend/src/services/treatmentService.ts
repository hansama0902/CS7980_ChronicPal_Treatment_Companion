import prisma from '../prisma/client';
import {
  ICreateTreatmentDto,
  ITreatmentEntry,
  ITreatmentQuery,
  IUpdateTreatmentDto,
  TreatmentType,
} from '../types/treatment';
import { NotFoundError } from '../utils/errors';

/**
 * Maps a Prisma TreatmentEntry record to the domain ITreatmentEntry interface.
 */
function toTreatmentEntry(record: {
  id: string;
  userId: string;
  date: Date;
  type: string;
  uricAcidLevel: number | null;
  painScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ITreatmentEntry {
  return {
    id: record.id,
    userId: record.userId,
    date: record.date,
    type: record.type as TreatmentType,
    uricAcidLevel: record.uricAcidLevel,
    painScore: record.painScore,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Creates a new treatment entry for the given user.
 */
export async function createTreatment(
  userId: string,
  dto: ICreateTreatmentDto,
): Promise<ITreatmentEntry> {
  const record = await prisma.treatmentEntry.create({
    data: {
      userId,
      date: new Date(dto.date),
      type: dto.type,
      uricAcidLevel: dto.uricAcidLevel ?? null,
      painScore: dto.painScore ?? null,
      notes: dto.notes ?? null,
    },
  });
  return toTreatmentEntry(record);
}

/**
 * Returns all treatment entries for a user, ordered by date descending.
 * Optionally filtered by date range for trend window queries (1mo/3mo/6mo/1yr).
 */
export async function getTreatments(
  userId: string,
  query: ITreatmentQuery,
): Promise<ITreatmentEntry[]> {
  const records = await prisma.treatmentEntry.findMany({
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
  return records.map(toTreatmentEntry);
}

/**
 * Updates a treatment entry. Verifies ownership before updating.
 * Throws NotFoundError if the entry does not exist or belongs to another user.
 */
export async function updateTreatment(
  userId: string,
  id: string,
  dto: IUpdateTreatmentDto,
): Promise<ITreatmentEntry> {
  const existing = await prisma.treatmentEntry.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Treatment entry not found');
  }

  const record = await prisma.treatmentEntry.update({
    where: { id },
    data: {
      ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.uricAcidLevel !== undefined ? { uricAcidLevel: dto.uricAcidLevel } : {}),
      ...(dto.painScore !== undefined ? { painScore: dto.painScore } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    },
  });
  return toTreatmentEntry(record);
}

/**
 * Deletes a treatment entry. Verifies ownership before deleting.
 * Throws NotFoundError if the entry does not exist or belongs to another user.
 */
export async function deleteTreatment(userId: string, id: string): Promise<void> {
  const existing = await prisma.treatmentEntry.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Treatment entry not found');
  }
  await prisma.treatmentEntry.delete({ where: { id } });
}
