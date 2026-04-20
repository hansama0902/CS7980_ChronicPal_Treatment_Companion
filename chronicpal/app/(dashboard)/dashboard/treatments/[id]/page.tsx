import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { TreatmentType } from '@/types/treatment';

const TYPE_LABEL: Record<TreatmentType, string> = {
  INFUSION: 'Infusion',
  MEDICATION: 'Medication',
  CLINIC_VISIT: 'Clinic Visit',
};

const TYPE_BADGE: Record<TreatmentType, string> = {
  INFUSION: 'bg-blue-100 text-blue-700',
  MEDICATION: 'bg-purple-100 text-purple-700',
  CLINIC_VISIT: 'bg-green-100 text-green-700',
};

function painScoreClass(score: number): string {
  if (score <= 3) return 'text-green-600';
  if (score <= 6) return 'text-yellow-600';
  return 'text-red-600';
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const treatment = await prisma.treatmentEntry.findFirst({
    where: { id, userId },
  });

  if (!treatment) notFound();

  const type = treatment.type as TreatmentType;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/treatments"
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit"
      >
        ← Back to Treatments
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900">Treatment Record</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${TYPE_BADGE[type]}`}>
            {TYPE_LABEL[type]}
          </span>
          <span className="text-sm text-gray-500">
            {treatment.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <hr className="border-gray-100" />

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pain Score</p>
            <p
              className={`text-3xl font-bold ${treatment.painScore !== null ? painScoreClass(treatment.painScore) : 'text-gray-300'}`}
            >
              {treatment.painScore !== null ? `${treatment.painScore}/10` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Uric Acid Level</p>
            <p className="text-3xl font-bold text-gray-900">
              {treatment.uricAcidLevel !== null ? (
                <>
                  {treatment.uricAcidLevel}
                  <span className="text-base font-normal text-gray-500 ml-1">mg/dL</span>
                </>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </p>
          </div>
        </div>

        {treatment.notes && (
          <>
            <hr className="border-gray-100" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {treatment.notes}
              </p>
            </div>
          </>
        )}

        <hr className="border-gray-100" />
        <p className="text-xs text-gray-400">
          Recorded on{' '}
          {treatment.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
