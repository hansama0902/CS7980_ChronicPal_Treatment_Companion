'use client';

import { useRef, useState } from 'react';
import type React from 'react';
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

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';
type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

interface FoodItem {
  name: string;
  risk: RiskLevel;
  purine: number;
}

interface AnalysisResult {
  riskLevel: RiskLevel;
  purineEstimate: number;
  foods: FoodItem[];
  suggestion: string;
}

interface DietHistoryEntry {
  id: string;
  meal: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  purineLevel: RiskLevel;
  riskScore: number | null;
  date: string;
}

interface DietChartPoint {
  date: string;
  purineEstimate: number;
  risk: RiskLevel;
}

const RISK_BAR_COLORS: Record<RiskLevel, string> = {
  LOW: '#16A34A',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
};

const RISK_BADGE_STYLE: Record<RiskLevel, React.CSSProperties> = {
  LOW: { backgroundColor: '#DCFCE7', color: '#15803D' },
  MEDIUM: { backgroundColor: '#FEF3C7', color: '#D97706' },
  HIGH: { backgroundColor: '#FEE2E2', color: '#DC2626' },
};

const RISK_BANNER_STYLE: Record<RiskLevel, React.CSSProperties> = {
  LOW: { backgroundColor: '#DCFCE7', color: '#15803D' },
  MEDIUM: { backgroundColor: '#FEF3C7', color: '#D97706' },
  HIGH: { backgroundColor: '#FEE2E2', color: '#DC2626' },
};

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'BREAKFAST' },
  { label: 'Lunch', value: 'LUNCH' },
  { label: 'Dinner', value: 'DINNER' },
];

const ALLOWED_TYPES: SupportedMimeType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function formatMealLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-8 h-8 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
      />
    </svg>
  );
}

export default function DietAnalysisClient({
  history,
  chartData,
}: {
  history: DietHistoryEntry[];
  chartData: DietChartPoint[];
}) {
  const [meal, setMeal] = useState('');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<SupportedMimeType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type as SupportedMimeType)) {
      setError('Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Strip the "data:image/jpeg;base64," prefix — Claude wants raw base64
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setImageMimeType(file.type as SupportedMimeType);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleAnalyze() {
    if (!meal.trim() && !imageBase64) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        mealType,
        date: new Date().toISOString(),
      };
      if (meal.trim()) body.meal = meal;
      if (imageBase64) {
        body.imageBase64 = imageBase64;
        body.imageMimeType = imageMimeType;
      }

      const res = await fetch('/api/diet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const canAnalyze = !isLoading && (meal.trim() !== '' || imageBase64 !== null);

  return (
    <div className="flex flex-col gap-6">
      {/* Upper two-column section */}
      <div className="flex gap-5">
        {/* Left: Analyze a Meal */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Analyze a Meal</h2>

          {/* Photo upload + OR + text input */}
          <div className="flex gap-3 items-stretch mb-4">
            {/* Photo upload */}
            <div className="flex-1 flex flex-col">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <div
                  className="relative flex-1 rounded-xl overflow-hidden border border-gray-200"
                  style={{ minHeight: '120px' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Meal preview"
                    className="w-full h-full object-cover"
                    style={{ minHeight: '120px' }}
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 shadow text-xs font-bold"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 py-6 hover:border-blue-400 transition-colors bg-white"
                  style={{ minHeight: '120px' }}
                >
                  <CameraIcon />
                  <span className="text-xs font-medium text-gray-500">Upload meal photo</span>
                  <span className="text-xs text-gray-400">or drag &amp; drop</span>
                </button>
              )}
            </div>

            {/* OR divider */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 px-1">OR</span>
              <div className="w-px flex-1 bg-gray-200" />
            </div>

            {/* Text input */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Describe your meal</label>
              <textarea
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
                placeholder="e.g., Grilled salmon with asparagus and rice..."
                maxLength={500}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>

          {/* Meal type pills */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">Meal Type</label>
            <div className="flex gap-2">
              {MEAL_TYPES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setMealType(value)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={
                    mealType === value
                      ? { backgroundColor: '#2563EB', color: '#ffffff' }
                      : { backgroundColor: '#E5E7EB', color: '#6B7280' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          <button
            onClick={() => void handleAnalyze()}
            disabled={!canAnalyze}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
            style={{ backgroundColor: '#2563EB' }}
          >
            {isLoading ? 'Analyzing...' : '🤖 Analyze with AI'}
          </button>

          {error && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Right: AI Analysis Result */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">AI Analysis Result</h2>

          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <span className="text-2xl">🤖</span>
              <span>Analyze a meal to see AI insights</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Risk banner */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={RISK_BANNER_STYLE[result.riskLevel]}
              >
                <span className="font-bold text-sm">
                  {result.riskLevel === 'MEDIUM' ? '⚠️ ' : ''}
                  {result.riskLevel} RISK
                </span>
                <span className="text-xs font-medium">
                  Estimated purine: ~{result.purineEstimate}mg
                </span>
              </div>

              {/* Food breakdown */}
              {result.foods.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Food Breakdown</p>
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    {result.foods.map((food, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                        style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#F9FAFB' }}
                      >
                        <span className="text-gray-700">{food.name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={RISK_BADGE_STYLE[food.risk]}
                          >
                            {food.risk}
                          </span>
                          <span className="text-xs text-gray-500">{food.purine}mg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestion tip */}
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
              >
                <span>💡</span>
                <span>
                  <strong>Suggestion:</strong> {result.suggestion}
                </span>
              </div>

              <p className="text-xs text-gray-400 italic">
                AI-generated, not medical advice. Consult your healthcare provider.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Meal History section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Meal History</h2>
          <span className="text-sm font-medium cursor-pointer" style={{ color: '#2563EB' }}>
            Filter by risk ▾
          </span>
        </div>

        {/* Daily Purine Risk bar chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Daily Purine Risk (Past 30 Days)
              </h3>
              <div className="flex items-center gap-3">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                  <div key={level} className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: RISK_BAR_COLORS[level] }}
                    />
                    <span className="text-xs text-gray-500">
                      {level === 'LOW'
                        ? 'Low Risk'
                        : level === 'MEDIUM'
                          ? 'Medium Risk'
                          : 'High Risk'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value} mg`, 'Purines']} />
                <Bar dataKey="purineEstimate" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_BAR_COLORS[entry.risk]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Meal cards grid */}
        {history.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
            No meals logged yet. Analyze a meal above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {history.map((entry) => {
              const badge = RISK_BADGE_STYLE[entry.purineLevel];
              const entryDate = new Date(entry.date);
              const dateLabel = entryDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3"
                >
                  <div
                    className="w-12 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: '#E5E7EB' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatMealLabel(entry.mealType)} — {dateLabel}
                      </span>
                    </div>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-1"
                      style={badge}
                    >
                      {entry.purineLevel}
                    </span>
                    <p className="text-xs text-gray-500 truncate">{entry.meal}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
