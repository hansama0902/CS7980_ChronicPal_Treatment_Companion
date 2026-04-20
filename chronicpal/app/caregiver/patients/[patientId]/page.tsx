import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';
import { UricAcidChart, PainChart } from './PatientCharts';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(date),
  );
}

function getInitials(email: string): string {
  const prefix = email.split('@')[0];
  const parts = prefix.split(/[._-]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return prefix.substring(0, 2).toUpperCase();
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { patientId } = await params;
  const caregiverId = session.user.id;

  const link = await prisma.caregiverLink.findFirst({
    where: { caregiverId, patientId, status: 'ACTIVE' },
    include: { patient: true },
  });

  if (!link) notFound();

  const patient = link.patient;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    latestLab,
    labHistory,
    symptomHistory,
    recentSymptoms,
    nextTreatment,
    treatments,
    recentDiet,
    allDiet,
  ] = await Promise.all([
    prisma.labResult.findFirst({ where: { userId: patientId }, orderBy: { date: 'desc' } }),
    prisma.labResult.findMany({
      where: { userId: patientId, date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.symptomEntry.findMany({
      where: { userId: patientId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.symptomEntry.findMany({
      where: { userId: patientId, date: { gte: sevenDaysAgo } },
    }),
    prisma.treatmentEntry.findFirst({
      where: { userId: patientId, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    }),
    prisma.treatmentEntry.findMany({
      where: { userId: patientId },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.dietEntry.findMany({
      where: { userId: patientId, date: { gte: sevenDaysAgo }, deletedAt: null },
    }),
    prisma.dietEntry.findMany({
      where: { userId: patientId, deletedAt: null },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ]);

  const avgPain7d =
    recentSymptoms.length > 0
      ? recentSymptoms.reduce((s, e) => s + e.severity, 0) / recentSymptoms.length
      : null;

  const dietCompliance7d =
    recentDiet.length > 0
      ? Math.round(
          (recentDiet.filter((d) => d.purineLevel === 'LOW').length / recentDiet.length) * 100,
        )
      : null;

  const labChartData = labHistory.map((l) => ({
    date: formatShort(l.date),
    uricAcidLevel: l.uricAcidLevel,
  }));

  const painChartData = symptomHistory.map((s) => ({
    date: formatShort(s.date),
    severity: s.severity,
  }));

  const uricStatus =
    latestLab === null ? null : latestLab.uricAcidLevel < URIC_ACID_TARGET_MGDL ? 'good' : 'high';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/caregiver/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {getInitials(patient.email)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.email}</h1>
          <p className="text-sm text-gray-500">Linked since {formatDate(link.createdAt)}</p>
        </div>
        <span className="ml-auto bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-medium">
          Active Patient
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Latest Uric Acid</p>
          {latestLab ? (
            <>
              <p
                className={`text-2xl font-bold ${uricStatus === 'good' ? 'text-green-600' : 'text-red-600'}`}
              >
                {latestLab.uricAcidLevel.toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">mg/dL</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(latestLab.date)}</p>
              <p
                className={`text-xs mt-1 ${uricStatus === 'good' ? 'text-green-600' : 'text-red-600'}`}
              >
                {uricStatus === 'good'
                  ? `Below ${URIC_ACID_TARGET_MGDL} target`
                  : `Above ${URIC_ACID_TARGET_MGDL} target`}
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-400">No data</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Pain (7d)</p>
          {avgPain7d !== null ? (
            <>
              <p
                className={`text-2xl font-bold ${avgPain7d <= 3 ? 'text-green-600' : avgPain7d <= 6 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {avgPain7d.toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">/ 10</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {recentSymptoms.length} symptom entr{recentSymptoms.length === 1 ? 'y' : 'ies'}
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-400">No data</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Diet Compliance (7d)</p>
          {dietCompliance7d !== null ? (
            <>
              <p
                className={`text-2xl font-bold ${dietCompliance7d >= 70 ? 'text-green-600' : dietCompliance7d >= 40 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {dietCompliance7d}
                <span className="text-sm font-normal text-gray-500 ml-1">% low-purine</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{recentDiet.length} meal entries</p>
            </>
          ) : (
            <p className="text-lg text-gray-400">No data</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Treatment</p>
          {nextTreatment ? (
            <>
              <p className="text-2xl font-bold text-blue-600">
                {Math.ceil(
                  (new Date(nextTreatment.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                )}
                <span className="text-sm font-normal text-gray-500 ml-1">days</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(nextTreatment.date)}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {nextTreatment.type.replace('_', ' ').toLowerCase()}
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-400">None scheduled</p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Uric Acid Trend (6 months)</h2>
          <UricAcidChart data={labChartData} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Symptom Severity (30 days)</h2>
          <PainChart data={painChartData} />
        </div>
      </div>

      {/* Treatments table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Treatments</h2>
        {treatments.length === 0 ? (
          <p className="text-sm text-gray-400">No treatments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Uric Acid</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pain</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-gray-700 capitalize">
                      {t.type.replace('_', ' ').toLowerCase()}
                    </td>
                    <td className="px-4 py-3">
                      {t.uricAcidLevel != null ? (
                        <span
                          className={
                            t.uricAcidLevel < URIC_ACID_TARGET_MGDL
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {t.uricAcidLevel.toFixed(1)} mg/dL
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.painScore != null ? (
                        <span
                          className={
                            t.painScore <= 3
                              ? 'text-green-600'
                              : t.painScore <= 6
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {t.painScore}/10
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lab results table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Lab Results</h2>
        {labHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No lab results recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Uric Acid</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">vs Target</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[...labHistory].reverse().map((l) => (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDate(l.date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          l.uricAcidLevel < URIC_ACID_TARGET_MGDL
                            ? 'text-green-600 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {l.uricAcidLevel.toFixed(1)} mg/dL
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {l.uricAcidLevel < URIC_ACID_TARGET_MGDL
                        ? `${(URIC_ACID_TARGET_MGDL - l.uricAcidLevel).toFixed(1)} below target`
                        : `${(l.uricAcidLevel - URIC_ACID_TARGET_MGDL).toFixed(1)} above target`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{l.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent diet entries */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Diet Entries</h2>
        {allDiet.length === 0 ? (
          <p className="text-sm text-gray-400">No diet entries recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Meal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Purine Level</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {allDiet.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDate(d.date)}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{d.meal}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">
                      {d.mealType.toLowerCase()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          d.purineLevel === 'LOW'
                            ? 'bg-green-100 text-green-700'
                            : d.purineLevel === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {d.purineLevel.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.riskScore != null ? d.riskScore.toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
