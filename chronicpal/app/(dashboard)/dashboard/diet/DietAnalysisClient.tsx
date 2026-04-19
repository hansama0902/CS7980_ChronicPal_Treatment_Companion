'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FoodItem {
  name: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  purine: number;
}

interface AnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  purineEstimate: number;
  foods: FoodItem[];
  suggestion: string;
}

interface DietHistoryEntry {
  id: string;
  meal: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  purineLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number | null;
  date: string;
}

interface DietChartPoint {
  date: string;
  purineEstimate: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

const RISK_COLORS: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

const RISK_BADGE: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
type MealType = (typeof MEAL_TYPES)[number];

export default function DietAnalysisClient({
  history,
  chartData,
}: {
  history: DietHistoryEntry[];
  chartData: DietChartPoint[];
}) {
  const [meal, setMeal] = useState('');
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!meal.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/diet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal, mealType, date: new Date().toISOString() }),
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: { analysis: AnalysisResult };
        error?: string;
      };
      if (!data.success) {
        setError(data.error ?? 'Analysis failed');
      } else {
        setResult(data.data!.analysis);
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Input form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Analyze a Meal</h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mealType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <textarea
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            placeholder="Describe your meal (e.g., grilled salmon, brown rice, steamed broccoli)..."
            className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{meal.length}/500</span>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !meal.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Analysis result card */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Analysis Result</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${RISK_BADGE[result.riskLevel]}`}
            >
              {result.riskLevel} RISK
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Estimated Total Purines</p>
            <p className="text-2xl font-bold text-gray-900">{result.purineEstimate} mg</p>
          </div>

          {result.foods.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Food Breakdown</p>
              <div className="flex flex-col gap-1">
                {result.foods.map((food, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">{food.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{food.purine} mg</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_BADGE[food.risk]}`}
                      >
                        {food.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg px-4 py-3 mb-3">
            <p className="text-sm font-medium text-blue-800 mb-1">Suggestion</p>
            <p className="text-sm text-blue-700">{result.suggestion}</p>
          </div>

          <p className="text-xs text-gray-400 italic">
            AI-generated, not medical advice. Consult your healthcare provider for dietary guidance.
          </p>
        </div>
      )}

      {/* 30-day purine trend chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">30-Day Purine Risk Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: 'mg', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip formatter={(value) => [`${value} mg`, 'Purines']} />
              <Bar dataKey="purineEstimate" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 justify-end">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: RISK_COLORS[level] }}
                />
                <span className="text-xs text-gray-500">{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal history list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Meal History (Last 30 Days)</h2>
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No meals logged yet. Analyze a meal above to get started.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0 mr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.meal}</p>
                  <p className="text-xs text-gray-500">
                    {entry.mealType.charAt(0) + entry.mealType.slice(1).toLowerCase()} ·{' '}
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.riskScore !== null && (
                    <span className="text-xs text-gray-400">{entry.riskScore} mg</span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_BADGE[entry.purineLevel]}`}
                  >
                    {entry.purineLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
