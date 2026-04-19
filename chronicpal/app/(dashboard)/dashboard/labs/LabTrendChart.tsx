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

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { uricAcidLevel: number };
  index?: number;
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
      <LineChart data={data} margin={{ top: 8, right: 40, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          domain={[2, 10]}
          ticks={[2, 4, 6, 8, 10]}
          tick={{ fontSize: 12 }}
          label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
        />
        <Tooltip formatter={(value) => [`${value} mg/dL`, 'Uric Acid']} />
        <ReferenceLine
          y={URIC_ACID_TARGET_MGDL}
          stroke="#EF4444"
          strokeDasharray="5 5"
          label={{
            value: `${URIC_ACID_TARGET_MGDL}`,
            position: 'right',
            fill: '#EF4444',
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="uricAcidLevel"
          stroke="#2563EB"
          strokeWidth={2}
          dot={(dotProps: DotProps) => {
            if (dotProps.cx == null || dotProps.cy == null || !dotProps.payload) return <g />;
            const fill =
              dotProps.payload.uricAcidLevel < URIC_ACID_TARGET_MGDL ? '#16A34A' : '#2563EB';
            return (
              <circle
                key={`dot-${dotProps.index ?? 0}`}
                cx={dotProps.cx}
                cy={dotProps.cy}
                r={5}
                fill={fill}
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
