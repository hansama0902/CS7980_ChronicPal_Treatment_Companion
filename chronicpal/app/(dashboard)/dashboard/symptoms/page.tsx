import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SymptomClient from './SymptomClient';

export default async function SymptomsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const entries = await prisma.symptomEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      symptomType: true,
      severity: true,
      notes: true,
    },
  });

  const history = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    symptomType: e.symptomType,
    severity: e.severity,
    notes: e.notes,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Symptom Tracking</h1>
      <SymptomClient history={history} />
    </div>
  );
}
