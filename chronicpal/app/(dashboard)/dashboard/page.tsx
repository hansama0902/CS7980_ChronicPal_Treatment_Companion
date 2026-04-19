import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DashboardCharts from './DashboardCharts';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [nextTreatment, recentLabs, recentSymptoms, dietEntries, labTrend, painHistory] =
    await Promise.all([
      prisma.treatmentEntry.findFirst({
        where: { userId, date: { gt: now } },
        orderBy: { date: 'asc' },
      }),
      prisma.labResult.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 2,
        select: { uricAcidLevel: true },
      }),
      prisma.symptomEntry.findMany({
        where: { userId, date: { gte: sevenDaysAgo } },
        select: { severity: true },
      }),
      prisma.dietEntry.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        select: { purineLevel: true },
      }),
      prisma.labResult.findMany({
        where: { userId, date: { gte: sixMonthsAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, uricAcidLevel: true },
      }),
      prisma.symptomEntry.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, severity: true },
      }),
    ]);

  const latestUricAcid = recentLabs[0]?.uricAcidLevel ?? null;
  const prevUricAcid = recentLabs[1]?.uricAcidLevel ?? null;
  const uricTrend =
    latestUricAcid !== null && prevUricAcid !== null
      ? latestUricAcid > prevUricAcid
        ? '↑'
        : latestUricAcid < prevUricAcid
          ? '↓'
          : '→'
      : null;

  const avgPain =
    recentSymptoms.length > 0
      ? recentSymptoms.reduce((s, e) => s + e.severity, 0) / recentSymptoms.length
      : null;

  const dietCompliance =
    dietEntries.length > 0
      ? Math.round(
          (dietEntries.filter((d) => d.purineLevel !== 'HIGH').length / dietEntries.length) * 100,
        )
      : null;

  const painColorClass =
    avgPain === null
      ? ''
      : avgPain <= 3
        ? 'text-green-600'
        : avgPain <= 6
          ? 'text-yellow-600'
          : 'text-red-600';

  const labChartData = labTrend.map((l) => ({
    date: l.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uricAcidLevel: l.uricAcidLevel,
  }));

  const painChartData = painHistory.map((s) => ({
    date: s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    severity: s.severity,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {session?.user?.email}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Next Treatment"
          value={
            nextTreatment
              ? nextTreatment.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Not scheduled'
          }
          sub={nextTreatment?.type ?? ''}
        />
        <StatCard
          title="Latest Uric Acid"
          value={latestUricAcid !== null ? `${latestUricAcid} mg/dL` : 'No data'}
          badge={uricTrend ?? undefined}
          badgeColor={
            uricTrend === '↑'
              ? 'text-red-500'
              : uricTrend === '↓'
                ? 'text-green-500'
                : 'text-gray-400'
          }
        />
        <StatCard
          title="7-Day Avg Pain"
          value={avgPain !== null ? avgPain.toFixed(1) : 'No data'}
          sub={avgPain !== null ? '/ 10' : '(last 7 days)'}
          valueClass={painColorClass}
        />
        <StatCard
          title="Diet Compliance"
          value={dietCompliance !== null ? `${dietCompliance}%` : 'No data'}
          sub={dietEntries.length > 0 ? `${dietEntries.length} entries` : '(last 30 days)'}
        />
      </div>

      <DashboardCharts labData={labChartData} painData={painChartData} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Log Treatment', href: '/dashboard/treatments' },
            { label: 'Log Lab', href: '/dashboard/labs' },
            { label: 'Analyze Meal', href: '/dashboard/diet' },
            { label: 'Generate Summary', href: '/dashboard/summary' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  badge,
  badgeColor,
  valueClass,
}: {
  title: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-semibold text-gray-900 ${valueClass ?? ''}`}>{value}</span>
        {badge && <span className={`text-lg font-bold ${badgeColor ?? ''}`}>{badge}</span>}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
