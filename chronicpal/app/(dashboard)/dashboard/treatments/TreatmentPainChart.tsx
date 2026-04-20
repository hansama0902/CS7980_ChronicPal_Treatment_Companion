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

interface ChartPoint {
  date: string;
  painScore: number;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { painScore: number };
  index?: number;
}

function painDotFill(score: number): string {
  if (score <= 3) return '#16A34A';
  if (score <= 6) return '#D97706';
  return '#EF4444';
}

export default function TreatmentPainChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No pain score data in the last 6 months
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 40, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 12 }}
          label={{ value: 'Pain', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
        />
        <Tooltip formatter={(value) => [`${value} / 10`, 'Pain Score']} />
        <ReferenceLine
          y={7}
          stroke="#EF4444"
          strokeDasharray="5 5"
          label={{ value: 'Severe', position: 'right', fill: '#EF4444', fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="painScore"
          stroke="#2563EB"
          strokeWidth={2}
          dot={(dotProps: DotProps) => {
            if (dotProps.cx == null || dotProps.cy == null || !dotProps.payload) return <g />;
            return (
              <circle
                key={`dot-${dotProps.index ?? 0}`}
                cx={dotProps.cx}
                cy={dotProps.cy}
                r={5}
                fill={painDotFill(dotProps.payload.painScore)}
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
