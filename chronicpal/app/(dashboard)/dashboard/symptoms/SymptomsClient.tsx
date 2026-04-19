'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Symptom {
  id: string;
  date: string;
  severity: number;
  notes: string | null;
}

type PainLevel = 'low' | 'medium' | 'high';

function getPainLevel(score: number): PainLevel {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}

const SCORE_COLORS: Record<PainLevel, React.CSSProperties> = {
  low: { backgroundColor: '#DCFCE7', borderColor: '#16A34A', color: '#15803D' },
  medium: { backgroundColor: '#FEF9C3', borderColor: '#F59E0B', color: '#D97706' },
  high: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', color: '#DC2626' },
};

const CARD_BAR: Record<PainLevel, string> = {
  low: '#16A34A',
  medium: '#F59E0B',
  high: '#EF4444',
};

const CARD_BADGE: Record<PainLevel, React.CSSProperties> = {
  low: { backgroundColor: '#DCFCE7', color: '#15803D' },
  medium: { backgroundColor: '#FEF9C3', color: '#D97706' },
  high: { backgroundColor: '#FEE2E2', color: '#DC2626' },
};

const TRACK_GRADIENT =
  'linear-gradient(to right, #16A34A 0%, #16A34A 30%, #F59E0B 30%, #F59E0B 60%, #EF4444 60%, #EF4444 100%)';

export default function SymptomsClient({ initialSymptoms }: { initialSymptoms: Symptom[] }) {
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialSymptoms);
  const [score, setScore] = useState(5);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const level = getPainLevel(score);
  const scoreStyle = SCORE_COLORS[level];

  async function handleSubmit() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: Math.max(1, score),
          symptomType: 'Pain',
          notes: description.trim(),
          date: new Date(`${date}T12:00:00.000Z`).toISOString(),
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: { id: string; date: string; severity: number; notes: string | null };
        error?: string;
      };
      if (!data.success || !data.data) {
        setError(data.error ?? 'Failed to save');
      } else {
        setSymptoms((prev) => [
          {
            id: data.data!.id,
            date: data.data!.date,
            severity: data.data!.severity,
            notes: data.data!.notes,
          },
          ...prev,
        ]);
        setDescription('');
        setScore(5);
        setDate(new Date().toISOString().split('T')[0]);
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center mb-6 relative">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">
          Symptom Tracker
        </h1>
      </div>

      <div className="flex gap-5">
        {/* Left: Log Symptom (≈60%) */}
        <div className="flex-[3] bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Log Symptom</h2>

          {/* Pain Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Pain Score</span>
              <div
                className="w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-base"
                style={scoreStyle}
              >
                {score}
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="pain-slider w-full"
              style={{ background: TRACK_GRADIENT }}
            />

            <div className="flex justify-between text-xs text-gray-500 mt-2 px-0.5">
              {[0, 1, 3, 4, 6, 7, 10].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-2 px-0.5">
              <span className="font-medium" style={{ color: '#16A34A' }}>
                Low (0-3)
              </span>
              <span className="font-medium" style={{ color: '#D97706' }}>
                Moderate (4-6)
              </span>
              <span className="font-medium" style={{ color: '#EF4444' }}>
                Severe (7-10)
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your symptoms... (max 500 chars)"
              maxLength={500}
              className="w-full h-28 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ backgroundColor: '#F9F9F9' }}
            />
          </div>

          {/* Date + Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={() => void handleSubmit()}
              disabled={loading || !description.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2563EB' }}
            >
              {loading ? 'Saving...' : 'Save Symptom'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        {/* Right: Recent Symptoms (≈40%) */}
        <div className="flex-[2] bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Symptoms</h2>
          <div className="flex flex-col gap-3">
            {symptoms.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No symptoms logged yet</p>
            ) : (
              symptoms.slice(0, 12).map((s) => {
                const lvl = getPainLevel(s.severity);
                return (
                  <div
                    key={s.id}
                    className="flex rounded-lg border border-gray-100 overflow-hidden"
                  >
                    <div className="w-1 shrink-0" style={{ backgroundColor: CARD_BAR[lvl] }} />
                    <div className="flex-1 px-3 py-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-gray-800">
                          {new Date(s.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={CARD_BADGE[lvl]}
                        >
                          {s.severity}/10
                        </span>
                      </div>
                      {s.notes && <p className="text-xs text-gray-500 truncate">{s.notes}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
