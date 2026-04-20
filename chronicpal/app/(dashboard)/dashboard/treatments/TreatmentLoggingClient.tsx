'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TreatmentType } from '@/types/treatment';

const TREATMENT_TYPES: { value: TreatmentType; label: string }[] = [
  { value: TreatmentType.INFUSION, label: 'Infusion' },
  { value: TreatmentType.MEDICATION, label: 'Medication' },
  { value: TreatmentType.CLINIC_VISIT, label: 'Clinic Visit' },
];

const TYPE_BADGE: Record<TreatmentType, string> = {
  INFUSION: 'bg-blue-100 text-blue-700',
  MEDICATION: 'bg-purple-100 text-purple-700',
  CLINIC_VISIT: 'bg-green-100 text-green-700',
};

const TYPE_LABEL: Record<TreatmentType, string> = {
  INFUSION: 'Infusion',
  MEDICATION: 'Medication',
  CLINIC_VISIT: 'Clinic Visit',
};

function painScoreClass(score: number): string {
  if (score <= 3) return 'text-green-600';
  if (score <= 6) return 'text-yellow-600';
  return 'text-red-600';
}

interface TreatmentRecord {
  id: string;
  date: string;
  type: TreatmentType;
  painScore: number | null;
  uricAcidLevel: number | null;
  notes: string | null;
}

export default function TreatmentLoggingClient({ history }: { history: TreatmentRecord[] }) {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [type, setType] = useState<TreatmentType>(TreatmentType.INFUSION);
  const [painScore, setPainScore] = useState('');
  const [uricAcidLevel, setUricAcidLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      date: new Date(date).toISOString(),
      type,
      notes: notes.trim() || undefined,
    };
    if (painScore !== '') body.painScore = parseInt(painScore, 10);
    if (uricAcidLevel !== '') body.uricAcidLevel = parseFloat(uricAcidLevel);

    try {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!data.success) {
        setError(data.error ?? 'Failed to save treatment');
      } else {
        setDate(new Date().toISOString().slice(0, 16));
        setType(TreatmentType.INFUSION);
        setPainScore('');
        setUricAcidLevel('');
        setNotes('');
        router.refresh();
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this treatment record?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!data.success) {
        setError(data.error ?? 'Failed to delete treatment');
      } else {
        router.refresh();
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add new record form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Add a New Record</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type</label>
            <div className="flex gap-2 flex-wrap">
              {TREATMENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    type === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pain Score (0–10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={painScore}
                onChange={(e) => setPainScore(e.target.value)}
                placeholder="e.g. 4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uric Acid (mg/dL)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step={0.1}
                value={uricAcidLevel}
                onChange={(e) => setUricAcidLevel(e.target.value)}
                placeholder="e.g. 6.2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the treatment session, symptoms, or observations..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
            />
            <span className="text-xs text-gray-400">{notes.length}/1000</span>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Add a New Record'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* History grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Treatment History</h2>
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No treatment records yet. Add your first record above.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {history.map((record) => (
              <Link
                key={record.id}
                href={`/dashboard/treatments/${record.id}`}
                className="block border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[record.type]}`}
                  >
                    {TYPE_LABEL[record.type]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, record.id)}
                      disabled={deletingId === record.id}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors"
                      title="Delete record"
                    >
                      {deletingId === record.id ? (
                        <span className="text-xs">…</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {record.painScore !== null && (
                  <p className="text-sm text-gray-600 mb-1">
                    Pain:{' '}
                    <span className={`font-semibold ${painScoreClass(record.painScore)}`}>
                      {record.painScore}/10
                    </span>
                  </p>
                )}
                {record.uricAcidLevel !== null && (
                  <p className="text-sm text-gray-600 mb-1">
                    Uric Acid:{' '}
                    <span className="font-medium">{record.uricAcidLevel} mg/dL</span>
                  </p>
                )}
                {record.notes && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{record.notes}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
