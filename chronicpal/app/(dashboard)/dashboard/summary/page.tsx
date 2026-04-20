'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ISummaryResult } from '@/types/summary';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIso(dateStr: string): string {
  return new Date(dateStr).toISOString();
}

export default function SummaryPage() {
  useSession({ required: true });

  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ISummaryResult | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(type: 'success' | 'error', message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  async function handleGenerate() {
    if (!startDate || !endDate) {
      addToast('error', 'Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      addToast('error', 'Start date must be before end date.');
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/summaries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: toIso(startDate), endDate: toIso(endDate) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast('error', json.error ?? 'Failed to generate summary.');
        return;
      }
      setResult(json.data as ISummaryResult);
      addToast('success', 'Summary generated successfully.');
    } catch (err) {
      console.error('[summary] fetch error', err);
      addToast('error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleExportPDF() {
    window.print();
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav { display: none !important; }
          body { background: white; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
              t.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors no-print"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Pre-Visit Summary</h1>
        </div>

        {/* Date Range + Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 no-print">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : '🤖 Generate Summary'}
            </button>
            {result && (
              <button
                onClick={handleExportPDF}
                className="ml-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Export PDF
              </button>
            )}
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          ⚠ AI-generated summary — not medical advice. Please review with your healthcare provider.
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-red-50 rounded" />
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-4">
              Generating your summary — estimated 3–5 seconds…
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !result && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">
              Select a date range and click Generate Summary to create your pre-visit report.
            </p>
          </div>
        )}

        {/* Report card */}
        {!isLoading && result && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 print-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Patient Visit Summary Report
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Period: {result.dateRange.start} — {result.dateRange.end} · Generated{' '}
                  {new Date(result.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* Treatment Summary */}
                <section>
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Treatment Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {result.aiNarrative.treatmentSummary}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>
                      <span className="font-medium">Infusions completed:</span>{' '}
                      {result.rawData.treatmentSummary.infusionsCount}
                    </li>
                    {result.rawData.treatmentSummary.infusionDates.length > 0 && (
                      <li>
                        <span className="font-medium">Dates:</span>{' '}
                        {result.rawData.treatmentSummary.infusionDates.join(', ')}
                      </li>
                    )}
                    <li>
                      <span className="font-medium">Reactions noted:</span>{' '}
                      {result.rawData.treatmentSummary.hasReactions ? 'Yes (see notes)' : 'None'}
                    </li>
                    {result.rawData.treatmentSummary.nextScheduled && (
                      <li>
                        <span className="font-medium">Next infusion:</span>{' '}
                        {result.rawData.treatmentSummary.nextScheduled}
                      </li>
                    )}
                  </ul>
                </section>

                {/* Lab Result Trends */}
                <section>
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Lab Result Trends</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {result.aiNarrative.labTrends}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 mb-3">
                    {result.rawData.labTrends.latestUricAcid !== null && (
                      <li>
                        <span className="font-medium">Latest uric acid:</span>{' '}
                        <span
                          className={
                            result.rawData.labTrends.aboveTarget
                              ? 'text-red-600 font-semibold'
                              : 'text-green-700 font-semibold'
                          }
                        >
                          {result.rawData.labTrends.latestUricAcid.toFixed(1)} mg/dL
                        </span>{' '}
                        (target: ≤{result.rawData.labTrends.targetMgdl} mg/dL)
                      </li>
                    )}
                    {result.rawData.labTrends.percentChange !== null && (
                      <li>
                        <span className="font-medium">Change this period:</span>{' '}
                        <span
                          className={
                            result.rawData.labTrends.percentChange <= 0
                              ? 'text-green-700'
                              : 'text-red-600'
                          }
                        >
                          {result.rawData.labTrends.percentChange > 0 ? '+' : ''}
                          {result.rawData.labTrends.percentChange.toFixed(1)}%
                        </span>
                      </li>
                    )}
                  </ul>
                  {result.rawData.labTrends.uricAcidTrend.length >= 2 && (
                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.rawData.labTrends.uricAcidTrend}>
                          <XAxis dataKey="date" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip
                            contentStyle={{ fontSize: 11 }}
                            formatter={(v) => [`${v} mg/dL`, 'Uric Acid']}
                          />
                          <ReferenceLine
                            y={result.rawData.labTrends.targetMgdl}
                            stroke="#EF4444"
                            strokeDasharray="3 3"
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            dot={{ r: 3 }}
                            strokeWidth={1.5}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>

                {/* Symptom Overview */}
                <section>
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Symptom Overview</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {result.aiNarrative.symptomOverview}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>
                      <span className="font-medium">Avg pain score:</span>{' '}
                      {result.rawData.symptomOverview.avgPainScore !== null
                        ? `${result.rawData.symptomOverview.avgPainScore.toFixed(1)}/10`
                        : 'No data'}
                    </li>
                    <li>
                      <span className="font-medium">Severe flares (≥7/10):</span>{' '}
                      {result.rawData.symptomOverview.severeFlares.length}
                    </li>
                    {result.rawData.symptomOverview.severeFlares.map((f, i) => (
                      <li key={i} className="ml-3 text-red-600">
                        {f.date} — {f.type}, score {f.score}/10
                      </li>
                    ))}
                    <li>
                      <span className="font-medium">Flare-free days:</span>{' '}
                      {result.rawData.symptomOverview.flareFreeDays} of{' '}
                      {result.rawData.symptomOverview.totalDays} (
                      {Math.round(
                        (result.rawData.symptomOverview.flareFreeDays /
                          result.rawData.symptomOverview.totalDays) *
                          100,
                      )}
                      %)
                    </li>
                  </ul>
                </section>

                {/* Diet Compliance */}
                <section>
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Diet Compliance</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {result.aiNarrative.dietCompliance}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>
                      <span className="font-medium">Low-purine compliance:</span>{' '}
                      <span
                        className={
                          result.rawData.dietCompliance.compliancePercent >= 70
                            ? 'text-green-700 font-semibold'
                            : 'text-amber-600 font-semibold'
                        }
                      >
                        {result.rawData.dietCompliance.compliancePercent}%
                      </span>{' '}
                      ({result.rawData.dietCompliance.lowPurineMeals} of{' '}
                      {result.rawData.dietCompliance.totalMeals} meals)
                    </li>
                    {result.rawData.dietCompliance.highRiskItems.length > 0 && (
                      <li>
                        <span className="font-medium">High-risk items flagged:</span>
                        <ul className="ml-3 mt-0.5 space-y-0.5">
                          {result.rawData.dietCompliance.highRiskItems.map((item, i) => (
                            <li key={i} className="text-red-600">
                              {item.meal} — {item.count}×
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </section>
              </div>

              {/* Right column — Key Concerns */}
              <div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 h-full">
                  <h3 className="text-sm font-semibold text-red-700 mb-3">
                    Key Concerns for Discussion
                  </h3>
                  <p className="text-xs text-red-600 mb-3">
                    Bring these topics to your next appointment:
                  </p>
                  <ol className="space-y-3">
                    {result.aiNarrative.keyConcerns.map((concern, i) => (
                      <li key={i} className="flex gap-2 text-sm text-red-800">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
