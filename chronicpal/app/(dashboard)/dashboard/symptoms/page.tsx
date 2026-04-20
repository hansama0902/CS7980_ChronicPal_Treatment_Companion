import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SymptomsClient from './SymptomsClient';

export default async function SymptomsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const rows = await prisma.symptomEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 20,
    select: { id: true, date: true, severity: true, notes: true },
  });

  const initialSymptoms = rows.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    severity: s.severity,
    notes: s.notes,
  }));

  return <SymptomsClient initialSymptoms={initialSymptoms} />;
}
