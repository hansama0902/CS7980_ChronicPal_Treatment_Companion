import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';
import LinkPatientForm from './LinkPatientForm';

type PatientStats = {
  patientId: string;
  email: string;
  linkedSince: Date;
  latestUricAcid: number | null;
  avgPain7d: number | null;
  dietCompliance7d: number | null;
  nextTreatment: { date: Date; type: string } | null;
};

type ActivityItem = {
  id: string;
  date: Date;
  label: string;
  dotColor: 'blue' | 'green' | 'yellow' | 'red';
};

function getInitials(email: string): string {
  const prefix = email.split('@')[0];
  const parts = prefix.split(/[._-]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return prefix.substring(0, 2).toUpperCase();
}

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

function daysUntil(date: Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

async function getPatientStats(caregiverId: string): Promise<PatientStats[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const links = await prisma.caregiverLink.findMany({
    where: { caregiverId, status: 'ACTIVE' },
    include: { patient: true },
    orderBy: { createdAt: 'asc' },
  });

  if (links.length === 0) return [];

  return Promise.all(
    links.map(async (link) => {
      const pid = link.patientId;

      const [latestLab, recentSymptoms, nextTreatment, recentDiet] = await Promise.all([
        prisma.labResult.findFirst({ where: { userId: pid }, orderBy: { date: 'desc' } }),
        prisma.symptomEntry.findMany({
          where: { userId: pid, date: { gte: sevenDaysAgo } },
        }),
        prisma.treatmentEntry.findFirst({
          where: { userId: pid, date: { gte: new Date() } },
          orderBy: { date: 'asc' },
        }),
        prisma.dietEntry.findMany({
          where: { userId: pid, date: { gte: sevenDaysAgo }, deletedAt: null },
        }),
      ]);

      const avgPain =
        recentSymptoms.length > 0
          ? recentSymptoms.reduce((s, e) => s + e.severity, 0) / recentSymptoms.length
          : null;

      const lowCount = recentDiet.filter((d) => d.purineLevel === 'LOW').length;
      const dietCompliance =
        recentDiet.length > 0 ? Math.round((lowCount / recentDiet.length) * 100) : null;

      return {
        patientId: pid,
        email: link.patient.email,
        linkedSince: link.createdAt,
        latestUricAcid: latestLab?.uricAcidLevel ?? null,
        avgPain7d: avgPain !== null ? Math.round(avgPain * 10) / 10 : null,
        dietCompliance7d: dietCompliance,
        nextTreatment: nextTreatment
          ? { date: nextTreatment.date, type: nextTreatment.type }
          : null,
      };
    }),
  );
}

async function getRecentActivity(patientId: string): Promise<ActivityItem[]> {
  const [symptoms, labs, treatments] = await Promise.all([
    prisma.symptomEntry.findMany({
      where: { userId: patientId },
      orderBy: { date: 'desc' },
      take: 3,
    }),
    prisma.labResult.findMany({
      where: { userId: patientId },
      orderBy: { date: 'desc' },
      take: 2,
    }),
    prisma.treatmentEntry.findMany({
      where: { userId: patientId },
      orderBy: { date: 'desc' },
      take: 2,
    }),
  ]);

  const items: ActivityItem[] = [
    ...symptoms.map((s) => ({
      id: s.id,
      date: s.date,
      label: `Logged ${s.symptomType} severity: ${s.severity}/10${s.notes ? ` — ${s.notes}` : ''}`,
      dotColor: (s.severity >= 7 ? 'red' : s.severity >= 4 ? 'yellow' : 'blue') as
        | 'blue'
        | 'yellow'
        | 'red',
    })),
    ...labs.map((l) => ({
      id: l.id,
      date: l.date,
      label: `Lab result: Uric acid ${l.uricAcidLevel} mg/dL${l.uricAcidLevel <= URIC_ACID_TARGET_MGDL ? ' ✓ Within target' : ''}`,
      dotColor: (l.uricAcidLevel <= URIC_ACID_TARGET_MGDL
        ? 'green'
        : l.uricAcidLevel <= 8
          ? 'yellow'
          : 'red') as 'green' | 'yellow' | 'red',
    })),
    ...treatments.map((t) => ({
      id: t.id,
      date: t.date,
      label: `Treatment: ${t.type.replace(/_/g, ' ').toLowerCase()}${t.painScore != null ? ` (pain: ${t.painScore}/10)` : ''}`,
      dotColor: 'blue' as const,
    })),
  ];

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
}

const DOT = {
  blue: 'bg-blue-400',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
} as const;

const AVATAR_COLORS = ['bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'];

export default async function CaregiverDashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const patients = await getPatientStats(session.user.id);
  const [primaryPatient, ...otherPatients] = patients;

  const recentActivities = primaryPatient ? await getRecentActivity(primaryPatient.patientId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Caregiver Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor your linked patients (read-only)</p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Patients</h2>

        {patients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-gray-500 font-medium text-lg">No linked patients yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Send a link request below to start monitoring a patient&apos;s progress.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary patient — expanded card */}
            {primaryPatient && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getInitials(primaryPatient.email)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{primaryPatient.email}</p>
                      <p className="text-sm text-gray-500">
                        Linked since: {formatDate(primaryPatient.linkedSince)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/caregiver/patients/${primaryPatient.patientId}`}
                    className="text-sm text-blue-600 border border-blue-600 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors flex-shrink-0"
                  >
                    View Full Details →
                  </Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Latest Uric Acid</p>
                    <p className="font-bold text-gray-900">
                      {primaryPatient.latestUricAcid != null
                        ? `${primaryPatient.latestUricAcid} mg/dL`
                        : '—'}
                    </p>
                    {primaryPatient.latestUricAcid != null && (
                      <p
                        className={`text-xs mt-1 ${primaryPatient.latestUricAcid <= URIC_ACID_TARGET_MGDL ? 'text-green-600' : 'text-orange-500'}`}
                      >
                        {primaryPatient.latestUricAcid <= URIC_ACID_TARGET_MGDL
                          ? '✓ Within target'
                          : '↑ Above target'}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Avg Pain (7-day)</p>
                    <p className="font-bold text-gray-900">
                      {primaryPatient.avgPain7d != null ? `${primaryPatient.avgPain7d} / 10` : '—'}
                    </p>
                    {primaryPatient.avgPain7d != null && (
                      <p
                        className={`text-xs mt-1 ${primaryPatient.avgPain7d <= 3 ? 'text-green-600' : primaryPatient.avgPain7d <= 6 ? 'text-orange-500' : 'text-red-600'}`}
                      >
                        {primaryPatient.avgPain7d <= 3
                          ? 'Mild'
                          : primaryPatient.avgPain7d <= 6
                            ? 'Moderate'
                            : 'Severe'}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Diet Compliance</p>
                    <p className="font-bold text-gray-900">
                      {primaryPatient.dietCompliance7d != null
                        ? `${primaryPatient.dietCompliance7d}%`
                        : '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">This week</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Next Treatment</p>
                    <p className="font-bold text-gray-900">
                      {primaryPatient.nextTreatment
                        ? formatShort(primaryPatient.nextTreatment.date)
                        : '—'}
                    </p>
                    {primaryPatient.nextTreatment && (
                      <p className="text-xs text-gray-400 mt-1">
                        {daysUntil(primaryPatient.nextTreatment.date)} days —{' '}
                        {primaryPatient.nextTreatment.type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                      🔒 Read-only access
                    </span>
                  </div>
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-gray-400">No recent activity recorded.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {recentActivities.map((item) => (
                        <li key={item.id} className="flex items-start gap-3">
                          <div
                            className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT[item.dotColor]}`}
                          />
                          <span className="text-sm text-gray-700">
                            <span className="text-gray-400">{formatShort(item.date)}</span>
                            {' — '}
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Additional patients — collapsed rows */}
            {otherPatients.map((patient, i) => (
              <div
                key={patient.patientId}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length]}`}
                  >
                    {getInitials(patient.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{patient.email}</p>
                    <p className="text-xs text-gray-500">
                      Linked since {formatDate(patient.linkedSince)}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
                  {patient.latestUricAcid != null && (
                    <span>UA: {patient.latestUricAcid} mg/dL</span>
                  )}
                  {patient.avgPain7d != null && <span>Pain: {patient.avgPain7d}/10</span>}
                  {patient.dietCompliance7d != null && (
                    <span>Diet: {patient.dietCompliance7d}%</span>
                  )}
                </div>
                <Link
                  href={`/caregiver/patients/${patient.patientId}`}
                  className="text-sm text-blue-600 hover:text-blue-700 flex-shrink-0"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <LinkPatientForm />
    </div>
  );
}
