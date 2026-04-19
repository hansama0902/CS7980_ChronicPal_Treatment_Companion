'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';

interface LabChartPoint {
  date: string;
  uricAcidLevel: number;
}

export default function LabTrendChart({ data }: { data: LabChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No lab results in the last 6 months
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          domain={[0, 'auto']}
          tick={{ fontSize: 12 }}
          label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
        />
        <Tooltip formatter={(value) => [`${value} mg/dL`, 'Uric Acid']} />
        <ReferenceLine
          y={URIC_ACID_TARGET_MGDL}
          stroke="#ef4444"
          strokeDasharray="5 5"
          label={{
            value: `Target ${URIC_ACID_TARGET_MGDL} mg/dL`,
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
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
