'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';

interface LabPoint {
  date: string;
  uricAcidLevel: number;
}

interface PainPoint {
  date: string;
  severity: number;
}

function painBarColor(severity: number): string {
  if (severity <= 3) return '#22c55e';
  if (severity <= 6) return '#eab308';
  return '#ef4444';
}

export default function DashboardCharts({
  labData,
  painData,
}: {
  labData: LabPoint[];
  painData: PainPoint[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Uric Acid — 6-Month Trend
        </h2>
        {labData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No lab data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={labData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} mg/dL`, 'Uric Acid']} />
              <ReferenceLine
                y={URIC_ACID_TARGET_MGDL}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'Target', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="uricAcidLevel"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Pain Score — Last 30 Days</h2>
        {painData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No symptom data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={painData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="severity" radius={[3, 3, 0, 0]}>
                {painData.map((point, i) => (
                  <Cell key={i} fill={painBarColor(point.severity)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
