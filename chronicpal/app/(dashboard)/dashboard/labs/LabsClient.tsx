'use client';

import { useState } from 'react';
import Link from 'next/link';
import LabTrendChart from './LabTrendChart';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';

interface LabResult {
  id: string;
  date: string;
  uricAcidLevel: number;
  notes: string | null;
}

interface LabChartPoint {
  date: string;
  uricAcidLevel: number;
}

interface LabsClientProps {
  initialLabs: LabResult[];
  initialChartData: LabChartPoint[];
}

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  lab: LabResult | null;
}

function getStatus(value: number): 'Normal' | 'High' {
  return value < URIC_ACID_TARGET_MGDL ? 'Normal' : 'High';
}

export default function LabsClient({ initialLabs, initialChartData }: LabsClientProps) {
  const [labs, setLabs] = useState<LabResult[]>(initialLabs);
  const [chartData, setChartData] = useState<LabChartPoint[]>(initialChartData);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', lab: null });
  const [formDate, setFormDate] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refreshData() {
    try {
      const res = await fetch('/api/labs');
      const data = (await res.json()) as {
        success: boolean;
        data?: { id: string; date: string; uricAcidLevel: number; notes: string | null }[];
      };
      if (data.success && data.data) {
        const all: LabResult[] = data.data.map((l) => ({
          id: l.id,
          date: l.date,
          uricAcidLevel: l.uricAcidLevel,
          notes: l.notes,
        }));
        setLabs(all);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        setChartData(
          all
            .filter((l) => new Date(l.date) >= sixMonthsAgo)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((l) => ({
              date: new Date(l.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              uricAcidLevel: l.uricAcidLevel,
            })),
        );
      }
    } catch {
      // silent fail
    }
  }

  function openAdd() {
    setModal({ open: true, mode: 'add', lab: null });
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormValue('');
    setFormNotes('');
    setFormError(null);
  }

  function openEdit(lab: LabResult) {
    setModal({ open: true, mode: 'edit', lab });
    setFormDate(new Date(lab.date).toISOString().split('T')[0]);
    setFormValue(String(lab.uricAcidLevel));
    setFormNotes(lab.notes ?? '');
    setFormError(null);
  }

  function closeModal() {
    setModal({ open: false, mode: 'add', lab: null });
  }

  async function handleSave() {
    const value = parseFloat(formValue);
    if (isNaN(value) || value <= 0 || value > 20) {
      setFormError('Uric acid level must be between 0.1 and 20 mg/dL');
      return;
    }
    if (!formDate) {
      setFormError('Please select a date');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = modal.mode === 'edit' ? `/api/labs/${modal.lab!.id}` : '/api/labs';
      const method = modal.mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(`${formDate}T12:00:00.000Z`).toISOString(),
          uricAcidLevel: value,
          ...(formNotes.trim() ? { notes: formNotes.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (!data.success) {
        setFormError(data.error ?? 'Failed to save');
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
    if (!window.confirm('Delete this lab result?')) return;
    try {
      const res = await fetch(`/api/labs/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { success: boolean };
      if (data.success) await refreshData();
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
          Lab Results
        </h1>
      </div>

      {/* Add button */}
      <button
        onClick={openAdd}
        className="w-full mb-6 py-3 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: '#2563EB' }}
      >
        + Add New Lab Result
      </button>

      {/* Chart card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Uric Acid Trend</h2>
          <span className="text-sm font-medium" style={{ color: '#2563EB' }}>
            Last 6 months ▾
          </span>
        </div>
        <LabTrendChart data={chartData} />
      </div>

      {/* All Results table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">All Results</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Test Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No lab results recorded yet
                  </td>
                </tr>
              ) : (
                labs.map((lab) => {
                  const status = getStatus(lab.uricAcidLevel);
                  return (
                    <tr key={lab.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(lab.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">Uric Acid</td>
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: status === 'Normal' ? '#16A34A' : '#D97706' }}
                      >
                        {lab.uricAcidLevel}
                      </td>
                      <td className="px-4 py-3 text-gray-500">mg/dL</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={
                            status === 'Normal'
                              ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                              : { backgroundColor: '#FEF3C7', color: '#D97706' }
                          }
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(lab)}
                          className="text-xs font-medium mr-3 hover:underline"
                          style={{ color: '#2563EB' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(lab.id)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#EF4444' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
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
              {modal.mode === 'add' ? 'Add New Lab Result' : 'Edit Lab Result'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uric Acid Level (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
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
                  placeholder="Any notes about this test..."
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
