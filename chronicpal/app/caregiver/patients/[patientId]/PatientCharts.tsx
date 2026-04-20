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

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { uricAcidLevel: number };
  index?: number;
}

function painColor(severity: number): string {
  if (severity <= 3) return '#16a34a';
  if (severity <= 6) return '#eab308';
  return '#ef4444';
}

export function UricAcidChart({ data }: { data: LabPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No lab results recorded
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 40, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          domain={[2, 10]}
          ticks={[2, 4, 6, 8, 10]}
          tick={{ fontSize: 11 }}
          label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
        />
        <Tooltip formatter={(v) => [`${v} mg/dL`, 'Uric Acid']} />
        <ReferenceLine
          y={URIC_ACID_TARGET_MGDL}
          stroke="#ef4444"
          strokeDasharray="5 5"
          label={{
            value: `${URIC_ACID_TARGET_MGDL}`,
            position: 'right',
            fill: '#ef4444',
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="uricAcidLevel"
          stroke="#2563eb"
          strokeWidth={2}
          dot={(props: DotProps) => {
            if (props.cx == null || props.cy == null || !props.payload) return <g />;
            const fill =
              props.payload.uricAcidLevel < URIC_ACID_TARGET_MGDL ? '#16a34a' : '#2563eb';
            return (
              <circle
                key={`dot-${props.index ?? 0}`}
                cx={props.cx}
                cy={props.cy}
                r={4}
                fill={fill}
                stroke="white"
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PainChart({ data }: { data: PainPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No symptom entries recorded
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [v, 'Severity']} />
        <Bar dataKey="severity" radius={[3, 3, 0, 0]}>
          {data.map((point, i) => (
            <Cell key={i} fill={painColor(point.severity)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
