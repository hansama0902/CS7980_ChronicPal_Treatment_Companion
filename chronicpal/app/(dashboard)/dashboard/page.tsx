import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';
import DashboardCharts from './DashboardCharts';
import PendingCaregiverRequests from './PendingCaregiverRequests';
import ActiveCaregiverLinks from './ActiveCaregiverLinks';

const QUICK_ACTIONS = [
  {
    icon: '💉',
    title: 'Log Treatment',
    subtitle: 'Record infusion session',
    bg: 'bg-yellow-50',
    color: 'text-yellow-700',
    href: '/dashboard/treatments',
  },
  {
    icon: '🧪',
    title: 'Log Lab Result',
    subtitle: 'Record uric acid & blood work',
    bg: 'bg-blue-50',
    color: 'text-blue-700',
    href: '/dashboard/labs',
  },
  {
    icon: '📝',
    title: 'Log Symptoms',
    subtitle: 'Track pain & symptoms',
    bg: 'bg-purple-50',
    color: 'text-purple-700',
    href: '/dashboard/symptoms',
  },
  {
    icon: '🍽',
    title: 'Analyze Meal',
    subtitle: 'AI purine risk assessment',
    bg: 'bg-green-50',
    color: 'text-green-700',
    href: '/dashboard/diet',
  },
  {
    icon: '📋',
    title: 'Pre-Visit Summary',
    subtitle: 'Generate doctor report',
    bg: 'bg-orange-50',
    color: 'text-orange-700',
    href: '/dashboard/summary',
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const now2 = new Date();
  const [pendingLinks, activeLinks] = await Promise.all([
    prisma.caregiverLink.findMany({
      where: {
        patientId: userId,
        status: 'PENDING',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now2 } }],
      },
      include: { caregiver: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.caregiverLink.findMany({
      where: { patientId: userId, status: 'ACTIVE' },
      include: { caregiver: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

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
        where: { userId, date: { gte: sevenDaysAgo }, deletedAt: null },
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

  // Derived display values
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const daysAway =
    nextTreatment !== null
      ? Math.ceil((nextTreatment.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const uricAcidDiff =
    latestUricAcid !== null && prevUricAcid !== null
      ? Math.abs(latestUricAcid - prevUricAcid).toFixed(1)
      : null;
  const uricAcidColorClass =
    latestUricAcid !== null
      ? latestUricAcid < URIC_ACID_TARGET_MGDL
        ? 'text-green-600'
        : 'text-red-600'
      : '';
  const painLabel =
    avgPain === null ? '' : avgPain <= 3 ? 'Low' : avgPain <= 6 ? 'Moderate' : 'Severe';

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <p className="text-sm text-gray-400 mb-1">{formattedDate}</p>
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, here&apos;s your health overview</p>
      </div>

      <PendingCaregiverRequests
        initialLinks={pendingLinks.map((l) => ({
          id: l.id,
          caregiverEmail: l.caregiver.email,
          requestedAt: l.createdAt.toISOString(),
        }))}
      />

      <ActiveCaregiverLinks
        initialLinks={activeLinks.map((l) => ({
          id: l.id,
          caregiverEmail: l.caregiver.email,
          linkedSince: l.createdAt.toISOString(),
        }))}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Next Treatment"
          value={
            nextTreatment
              ? nextTreatment.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Not scheduled'
          }
          subtitle={
            nextTreatment && daysAway !== null
              ? `${nextTreatment.type} — ${daysAway} day${daysAway === 1 ? '' : 's'} away`
              : undefined
          }
        />
        <StatCard
          label="Latest Uric Acid"
          value={latestUricAcid !== null ? `${latestUricAcid} mg/dL` : 'No data'}
          valueClass={uricAcidColorClass}
          subtitle={
            uricAcidDiff !== null && uricTrend !== null
              ? `${uricTrend} ${uricAcidDiff} from last test (target < ${URIC_ACID_TARGET_MGDL})`
              : `Target < ${URIC_ACID_TARGET_MGDL} mg/dL`
          }
        />
        <StatCard
          label="Avg Pain Score (7-day)"
          value={avgPain !== null ? `${avgPain.toFixed(1)} / 10` : 'No data'}
          valueClass={painColorClass}
          subtitle={
            avgPain !== null
              ? `${painLabel} — based on ${recentSymptoms.length} entr${recentSymptoms.length === 1 ? 'y' : 'ies'}`
              : '(last 7 days)'
          }
        />
        <StatCard
          label="Diet Compliance"
          value={dietCompliance !== null ? `${dietCompliance}%` : 'No data'}
          valueClass={dietCompliance !== null ? 'text-green-600' : ''}
          subtitle={
            dietEntries.length > 0
              ? `Low-purine meals this week (${dietEntries.length} entries)`
              : '(last 7 days)'
          }
        />
      </div>

      <DashboardCharts labData={labChartData} painData={painChartData} />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map(({ icon, title, subtitle, bg, color, href }) => (
            <Link
              key={href}
              href={href}
              className={`${bg} rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow`}
            >
              <span className="text-2xl">{icon}</span>
              <span className={`font-bold text-sm ${color}`}>{title}</span>
              <span className="text-xs text-gray-500">{subtitle}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  valueClass,
}: {
  label: string;
  value: string;
  subtitle?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold text-gray-900 ${valueClass ?? ''}`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}
