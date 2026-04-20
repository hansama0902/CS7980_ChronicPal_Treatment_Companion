'use client';

import { useState } from 'react';
import Link from 'next/link';
import TreatmentPainChart from './TreatmentPainChart';

type TreatmentType = 'INFUSION' | 'MEDICATION' | 'CLINIC_VISIT';

interface Treatment {
  id: string;
  date: string;
  type: TreatmentType;
  uricAcidLevel: number | null;
  painScore: number | null;
  notes: string | null;
}

interface ChartPoint {
  date: string;
  painScore: number;
}

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  treatment: Treatment | null;
}

function painBadgeStyle(score: number): React.CSSProperties {
  if (score <= 3) return { backgroundColor: '#DCFCE7', color: '#15803D' };
  if (score <= 6) return { backgroundColor: '#FEF3C7', color: '#D97706' };
  return { backgroundColor: '#FEE2E2', color: '#DC2626' };
}

function formatType(type: TreatmentType): string {
  if (type === 'INFUSION') return 'Infusion';
  if (type === 'MEDICATION') return 'Medication';
  return 'Clinic Visit';
}

export default function TreatmentsClient({
  initialTreatments,
  initialChartData,
}: {
  initialTreatments: Treatment[];
  initialChartData: ChartPoint[];
}) {
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);
  const [chartData, setChartData] = useState<ChartPoint[]>(initialChartData);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', treatment: null });
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<TreatmentType>('INFUSION');
  const [formPainScore, setFormPainScore] = useState('');
  const [formUricAcid, setFormUricAcid] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refreshData() {
    try {
      const res = await fetch('/api/treatments');
      const json = (await res.json()) as { success: boolean; data?: Treatment[] };
      if (json.success && json.data) {
        const all = json.data;
        setTreatments(all);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        setChartData(
          all
            .filter((t) => t.painScore !== null && new Date(t.date) >= sixMonthsAgo)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((t) => ({
              date: new Date(t.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              painScore: t.painScore as number,
            })),
        );
      }
    } catch {
      // silent fail
    }
  }

  function openAdd() {
    setModal({ open: true, mode: 'add', treatment: null });
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('INFUSION');
    setFormPainScore('');
    setFormUricAcid('');
    setFormNotes('');
    setFormError(null);
  }

  function openEdit(t: Treatment) {
    setModal({ open: true, mode: 'edit', treatment: t });
    setFormDate(new Date(t.date).toISOString().split('T')[0]);
    setFormType(t.type);
    setFormPainScore(t.painScore !== null ? String(t.painScore) : '');
    setFormUricAcid(t.uricAcidLevel !== null ? String(t.uricAcidLevel) : '');
    setFormNotes(t.notes ?? '');
    setFormError(null);
  }

  function closeModal() {
    setModal({ open: false, mode: 'add', treatment: null });
  }

  async function handleSave() {
    if (!formDate) {
      setFormError('Please select a date');
      return;
    }
    const painScore = formPainScore !== '' ? parseInt(formPainScore, 10) : undefined;
    const uricAcidLevel = formUricAcid !== '' ? parseFloat(formUricAcid) : undefined;
    if (painScore !== undefined && (isNaN(painScore) || painScore < 0 || painScore > 10)) {
      setFormError('Pain score must be between 0 and 10');
      return;
    }
    if (
      uricAcidLevel !== undefined &&
      (isNaN(uricAcidLevel) || uricAcidLevel < 0 || uricAcidLevel > 30)
    ) {
      setFormError('Uric acid level must be between 0 and 30 mg/dL');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url =
        modal.mode === 'edit' ? `/api/treatments/${modal.treatment!.id}` : '/api/treatments';
      const method = modal.mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(`${formDate}T12:00:00.000Z`).toISOString(),
          type: formType,
          ...(painScore !== undefined ? { painScore } : {}),
          ...(uricAcidLevel !== undefined ? { uricAcidLevel } : {}),
          ...(formNotes.trim() ? { notes: formNotes.trim() } : {}),
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        setFormError(json.error ?? 'Failed to save');
      } else {
        closeModal();
        await refreshData();
      }
    } catch {
      setFormError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this treatment entry?')) return;
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { success: boolean };
      if (json.success) await refreshData();
    } catch {
      // silent fail
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
          Treatment Log
        </h1>
      </div>

      {/* Log Treatment button */}
      <button
        onClick={openAdd}
        className="w-full mb-6 py-3 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: '#2563EB' }}
      >
        + Log Treatment
      </button>

      {/* Pain Score Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Pain Score Trend</h2>
          <span className="text-sm font-medium" style={{ color: '#2563EB' }}>
            Last 6 months ▾
          </span>
        </div>
        <TreatmentPainChart data={chartData} />
      </div>

      {/* Treatment History Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Treatment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pain Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uric Acid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {treatments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No treatments logged yet. Click &apos;Log Treatment&apos; to add your first
                    entry.
                  </td>
                </tr>
              ) : (
                treatments.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(t.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatType(t.type)}</td>
                    <td className="px-4 py-3">
                      {t.painScore !== null ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={painBadgeStyle(t.painScore)}
                        >
                          {t.painScore}/10
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.uricAcidLevel !== null ? (
                        `${t.uricAcidLevel} mg/dL`
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {t.notes ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-xs font-medium mr-3 hover:underline"
                        style={{ color: '#2563EB' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleDelete(t.id)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#EF4444' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <h3 className="text-base font-bold text-gray-900 mb-5">
              {modal.mode === 'add' ? 'Log Treatment' : 'Edit Treatment'}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as TreatmentType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="INFUSION">Infusion</option>
                  <option value="MEDICATION">Medication</option>
                  <option value="CLINIC_VISIT">Clinic Visit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pain Score (0–10, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={formPainScore}
                  onChange={(e) => setFormPainScore(e.target.value)}
                  placeholder="e.g., 4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uric Acid Level (mg/dL, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={formUricAcid}
                  onChange={(e) => setFormUricAcid(e.target.value)}
                  placeholder="e.g., 5.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any notes about this treatment..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors hover:opacity-90"
                style={{ backgroundColor: '#2563EB' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
