import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LabsClient from './LabsClient';

export default async function LabsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const chartLabs = await prisma.labResult.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    orderBy: { date: 'asc' },
    select: { id: true, date: true, uricAcidLevel: true, notes: true },
  });

  const initialChartData = chartLabs.map((l) => ({
    date: l.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uricAcidLevel: l.uricAcidLevel,
  }));

  const allLabs = await prisma.labResult.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { id: true, date: true, uricAcidLevel: true, notes: true },
  });

  const initialLabs = allLabs.map((l) => ({
    id: l.id,
    date: l.date.toISOString(),
    uricAcidLevel: l.uricAcidLevel,
    notes: l.notes,
  }));

  return <LabsClient initialLabs={initialLabs} initialChartData={initialChartData} />;
}
