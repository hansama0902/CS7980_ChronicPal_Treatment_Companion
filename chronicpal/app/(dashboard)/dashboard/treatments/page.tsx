import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TreatmentsClient from './TreatmentsClient';

export default async function TreatmentsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const allTreatments = await prisma.treatmentEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { id: true, date: true, type: true, uricAcidLevel: true, painScore: true, notes: true },
  });

  const initialTreatments = allTreatments.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    type: t.type as 'INFUSION' | 'MEDICATION' | 'CLINIC_VISIT',
    uricAcidLevel: t.uricAcidLevel,
    painScore: t.painScore,
    notes: t.notes,
  }));

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const initialChartData = allTreatments
    .filter((t) => t.painScore !== null && t.date >= sixMonthsAgo)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((t) => ({
      date: t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      painScore: t.painScore as number,
    }));

  return (
    <TreatmentsClient initialTreatments={initialTreatments} initialChartData={initialChartData} />
  );
}
