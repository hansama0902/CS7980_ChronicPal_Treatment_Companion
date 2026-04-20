'use client';

import { useState } from 'react';
import { MAX_SYMPTOM_SEVERITY, MIN_SYMPTOM_SEVERITY } from '@/lib/constants';

interface SymptomHistoryEntry {
  id: string;
  date: string;
  symptomType: string;
  severity: number;
  notes: string | null;
}

const SEVERITY_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#4ade80',
  3: '#86efac',
  4: '#fde68a',
  5: '#fcd34d',
  6: '#fbbf24',
  7: '#fb923c',
  8: '#f87171',
  9: '#ef4444',
  10: '#dc2626',
};

function getSeverityColor(severity: number): string {
  return SEVERITY_COLORS[severity] ?? '#9ca3af';
}

function getSeverityLabel(severity: number): string {
  if (severity <= 2) return 'Mild';
  if (severity <= 4) return 'Low';
  if (severity <= 6) return 'Moderate';
  if (severity <= 8) return 'High';
  return 'Severe';
}

export default function SymptomClient({ history: initialHistory }: { history: SymptomHistoryEntry[] }) {
  const [history, setHistory] = useState(initialHistory);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 16);
  const [date, setDate] = useState(today);
  const [symptomType, setSymptomType] = useState('');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 16));
    setSymptomType('');
    setSeverity(5);
    setNotes('');
    setError(null);
    setSuccess(false);
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
    }
    setShowForm((prev) => !prev);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/symptoms/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setHistory((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symptomType.trim()) {
      setError('Symptom type is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          symptomType: symptomType.trim(),
          severity,
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: SymptomHistoryEntry & { createdAt: string; updatedAt: string; userId: string };
        error?: string;
      };
      if (!data.success) {
        setError(data.error ?? 'Failed to save symptom.');
      } else if (data.data) {
        const newEntry: SymptomHistoryEntry = {
          id: data.data.id,
          date: data.data.date,
          symptomType: data.data.symptomType,
          severity: data.data.severity,
          notes: data.data.notes,
        };
        setHistory((prev) => [newEntry, ...prev]);
        setSuccess(true);
        resetForm();
        setTimeout(() => {
          setShowForm(false);
          setSuccess(false);
        }, 1200);
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left column: button + expandable form */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <button
          onClick={toggleForm}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg leading-none">{showForm ? '−' : '+'}</span>
          {showForm ? 'Cancel' : 'Add a New Symptom'}
        </button>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">New Symptom Entry</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Symptom Type</label>
                <input
                  type="text"
                  value={symptomType}
                  onChange={(e) => setSymptomType(e.target.value)}
                  placeholder="e.g. Joint Pain, Fatigue, Swelling"
                  maxLength={100}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">
                    Pain Score ({MIN_SYMPTOM_SEVERITY}–{MAX_SYMPTOM_SEVERITY})
                  </label>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: getSeverityColor(severity) + '33',
                      color: getSeverityColor(severity),
                    }}
                  >
                    {severity} — {getSeverityLabel(severity)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_SYMPTOM_SEVERITY}
                  max={MAX_SYMPTOM_SEVERITY}
                  step={1}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{MIN_SYMPTOM_SEVERITY}</span>
                  <span>{MAX_SYMPTOM_SEVERITY}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Description (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details about your symptom..."
                  rows={3}
                  maxLength={1000}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Symptom logged successfully!
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Symptom'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Right column: history list */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Symptom History</h2>
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No symptoms logged yet. Use the button on the left to add your first entry.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0 mr-4">
                  <p className="text-sm font-medium text-gray-900">{entry.symptomType}</p>
                  {entry.notes && (
                    <p className="text-xs text-gray-500 truncate max-w-xs">{entry.notes}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: getSeverityColor(entry.severity) + '22',
                      color: getSeverityColor(entry.severity),
                      border: `1px solid ${getSeverityColor(entry.severity)}55`,
                    }}
                  >
                    {entry.severity}/10
                  </span>
                  <span className="text-xs text-gray-500">{getSeverityLabel(entry.severity)}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="ml-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deletingId === entry.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
