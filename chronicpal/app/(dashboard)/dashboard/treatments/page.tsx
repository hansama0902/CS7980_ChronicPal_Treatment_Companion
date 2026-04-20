import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TreatmentLoggingClient from './TreatmentLoggingClient';
import { TreatmentType } from '@/types/treatment';

export default async function TreatmentsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const treatments = await prisma.treatmentEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      type: true,
      painScore: true,
      uricAcidLevel: true,
      notes: true,
    },
  });

  const history = treatments.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    type: t.type as TreatmentType,
    painScore: t.painScore,
    uricAcidLevel: t.uricAcidLevel,
    notes: t.notes,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Treatment Logging</h1>
      <TreatmentLoggingClient history={history} />
    </div>
  );
}
