import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DietAnalysisClient from './DietAnalysisClient';

export default async function DietPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const entries = await prisma.dietEntry.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      meal: true,
      mealType: true,
      purineLevel: true,
      riskScore: true,
      date: true,
    },
  });

  const history = entries.map((e) => ({
    id: e.id,
    meal: e.meal,
    mealType: e.mealType,
    purineLevel: e.purineLevel,
    riskScore: e.riskScore,
    date: e.date.toISOString(),
  }));

  const chartData = entries
    .filter((e) => e.riskScore !== null)
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((e) => ({
      date: e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      purineEstimate: e.riskScore!,
      risk: e.purineLevel as 'LOW' | 'MEDIUM' | 'HIGH',
    }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Diet &amp; Purine Tracker</h1>
      <DietAnalysisClient history={history} chartData={chartData} />
    </div>
  );
}
