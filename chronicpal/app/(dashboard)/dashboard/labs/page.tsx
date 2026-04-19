import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LabTrendChart from './LabTrendChart';

export default async function LabsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const labs = await prisma.labResult.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    orderBy: { date: 'asc' },
    select: { id: true, date: true, uricAcidLevel: true, notes: true },
  });

  const chartData = labs.map((l) => ({
    date: l.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uricAcidLevel: l.uricAcidLevel,
  }));

  const allLabs = await prisma.labResult.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { id: true, date: true, uricAcidLevel: true, notes: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Lab Results</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Uric Acid Trend — Last 6 Months
        </h2>
        <LabTrendChart data={chartData} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Uric Acid (mg/dL)
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {allLabs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  No lab results recorded yet
                </td>
              </tr>
            ) : (
              allLabs.map((lab) => (
                <tr key={lab.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {lab.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{lab.uricAcidLevel}</td>
                  <td className="px-4 py-3 text-gray-500">{lab.notes ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
