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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Uric Acid Trend (6 months)</h2>
        {labData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No lab data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={labData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" mg/dL" width={60} />
              <Tooltip formatter={(v) => [`${v} mg/dL`, 'Uric Acid']} />
              <ReferenceLine
                y={URIC_ACID_TARGET_MGDL}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{
                  value: `Target ${URIC_ACID_TARGET_MGDL}`,
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="uricAcidLevel"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Pain Score Trend (30 days)</h2>
        {painData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No symptom data yet</p>
        ) : (
          <>
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
            <div className="flex items-center justify-center gap-5 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                Low (0–3)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" />
                Moderate (4–6)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
                Severe (7–10)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
