'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
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
type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
type DateFilter = 'DAYS_7' | 'DAYS_30' | 'MONTHS_3' | 'CUSTOM';

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
  mealType: MealType;
  purineLevel: RiskLevel;
  riskScore: number | null;
  date: string;
}

interface DietChartPoint {
  date: string;
  purineEstimate: number;
  risk: RiskLevel;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
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

const RISK_ORDER: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'BREAKFAST' },
  { label: 'Lunch', value: 'LUNCH' },
  { label: 'Dinner', value: 'DINNER' },
  { label: 'Snack', value: 'SNACK' },
];

const DATE_FILTER_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: 'Past 7 Days', value: 'DAYS_7' },
  { label: 'Past 30 Days', value: 'DAYS_30' },
  { label: 'Past 3 Months', value: 'MONTHS_3' },
  { label: 'Custom Range', value: 'CUSTOM' },
];

const ALLOWED_TYPES: SupportedMimeType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function formatMealLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

// Aggregate entries by calendar day; sum purines, take highest risk per day
function buildChartData(entries: DietHistoryEntry[]): DietChartPoint[] {
  const byDay = new Map<string, { totalPurine: number; maxRisk: RiskLevel; label: string }>();
  for (const entry of entries) {
    if (entry.riskScore === null) continue;
    const d = new Date(entry.date);
    const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD for sort-safe keys
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = byDay.get(dayKey);
    if (existing) {
      existing.totalPurine += entry.riskScore;
      if (RISK_ORDER[entry.purineLevel] > RISK_ORDER[existing.maxRisk]) {
        existing.maxRisk = entry.purineLevel;
      }
    } else {
      byDay.set(dayKey, { totalPurine: entry.riskScore, maxRisk: entry.purineLevel, label });
    }
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { totalPurine, maxRisk, label }]) => ({
      date: label,
      purineEstimate: Math.round(totalPurine),
      risk: maxRisk,
    }));
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

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

export default function DietAnalysisClient({
  history: initialHistory,
}: {
  history: DietHistoryEntry[];
}) {
  // Form state
  const [meal, setMeal] = useState('');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<SupportedMimeType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History state (initialised from server-rendered props, then kept in sync client-side)
  const [localHistory, setLocalHistory] = useState<DietHistoryEntry[]>(initialHistory);
  const [localChartData, setLocalChartData] = useState<DietChartPoint[]>(() =>
    buildChartData(initialHistory),
  );
  const [isFetching, setIsFetching] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState<DateFilter>('DAYS_30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const isMounted = useRef(false);

  function addToast(type: 'success' | 'error', message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  const fetchHistory = useCallback(async () => {
    const now = new Date();
    let from: string | null = null;
    let to: string | null = null;

    if (dateFilter === 'DAYS_7') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateFilter === 'DAYS_30') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateFilter === 'MONTHS_3') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateFilter === 'CUSTOM') {
      from = customFrom ? new Date(customFrom).toISOString() : null;
      to = customTo ? new Date(customTo + 'T23:59:59').toISOString() : null;
    }

    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    setIsFetching(true);
    try {
      const res = await fetch(`/api/diet?${params.toString()}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: Array<{
          id: string;
          meal: string;
          mealType: string;
          purineLevel: string;
          riskScore: number | null;
          date: string;
        }>;
      };
      if (json.success && json.data) {
        const entries: DietHistoryEntry[] = json.data.map((e) => ({
          id: e.id,
          meal: e.meal,
          mealType: e.mealType as MealType,
          purineLevel: e.purineLevel as RiskLevel,
          riskScore: e.riskScore,
          date: e.date,
        }));
        setLocalHistory(entries);
        setLocalChartData(buildChartData(entries));
      }
    } catch {
      // Silent — avoid logging PHI
    } finally {
      setIsFetching(false);
    }
  }, [dateFilter, customFrom, customTo]);

  // Re-fetch when filter changes; skip the very first render (server data is current)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    void fetchHistory();
  }, [fetchHistory]);

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
      setImageBase64(dataUrl.split(',')[1]);
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

  function handleEditClick(entry: DietHistoryEntry) {
    setEditingId(entry.id);
    setMeal(entry.meal);
    setMealType(entry.mealType);
    const d = new Date(entry.date);
    setEditDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
    setResult(null);
    setError(null);
    clearImage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setMeal('');
    setEditDate('');
    setError(null);
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
        data?: { dietEntry: unknown; analysis: AnalysisResult };
        error?: string;
      };
      if (!data.success) {
        setError(data.error ?? 'Analysis failed');
      } else {
        const analysis = data.data?.analysis ?? null;
        if (analysis) {
          setResult(analysis);
          addToast('success', 'Meal analyzed successfully');
          void fetchHistory();
        } else {
          setError('Analysis returned no results — please try again');
        }
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingId || !meal.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const date = editDate
        ? new Date(editDate + 'T12:00:00').toISOString()
        : new Date().toISOString();
      const res = await fetch(`/api/diet/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal, mealType, date }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        addToast('success', 'Meal entry updated');
        setEditingId(null);
        setMeal('');
        setEditDate('');
        void fetchHistory();
      } else {
        setError(data.error ?? 'Update failed');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingId) return;
    const idToDelete = deletingId;
    setDeletingId(null);
    try {
      const res = await fetch(`/api/diet/${idToDelete}`, { method: 'DELETE' });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        addToast('success', 'Meal entry deleted');
        void fetchHistory();
      } else {
        addToast('error', data.error ?? 'Delete failed');
      }
    } catch {
      addToast('error', 'Failed to connect to server');
    }
  }

  const isEditMode = editingId !== null;
  const canAnalyze = !isLoading && (meal.trim() !== '' || imageBase64 !== null);
  const canUpdate = !isLoading && meal.trim() !== '';

  return (
    <div className="flex flex-col gap-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto"
            style={
              toast.type === 'success'
                ? { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }
                : { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
            }
          >
            {toast.type === 'success' ? '✓ ' : '✕ '}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete this entry?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete this meal entry? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => void handleConfirmDelete()}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#EF4444' }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upper two-column section */}
      <div className="flex gap-5">
        {/* Left: Analyze / Edit a Meal */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              {isEditMode ? 'Edit Meal Entry' : 'Analyze a Meal'}
            </h2>
            {isEditMode && (
              <button
                onClick={handleCancelEdit}
                className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {/* Photo upload + OR + text input (analyze mode only) */}
          {!isEditMode && (
            <div className="flex gap-3 items-stretch mb-4">
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

              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-px flex-1 bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 px-1">OR</span>
                <div className="w-px flex-1 bg-gray-200" />
              </div>

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
          )}

          {/* Edit mode: meal description + date inputs */}
          {isEditMode && (
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Meal Description
                </label>
                <textarea
                  value={meal}
                  onChange={(e) => setMeal(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          )}

          {/* Meal type pills */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">Meal Type</label>
            <div className="flex gap-2 flex-wrap">
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

          {/* Submit button */}
          <button
            onClick={() => (isEditMode ? void handleUpdate() : void handleAnalyze())}
            disabled={isEditMode ? !canUpdate : !canAnalyze}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
            style={{ backgroundColor: '#2563EB' }}
          >
            {isLoading
              ? isEditMode
                ? 'Updating...'
                : 'Analyzing...'
              : isEditMode
                ? '✏️ Update Entry'
                : '🤖 Analyze with AI'}
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
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={RISK_BADGE_STYLE[result.riskLevel]}
              >
                <span className="font-bold text-sm">
                  {result.riskLevel === 'MEDIUM' ? '⚠️ ' : ''}
                  {result.riskLevel} RISK
                </span>
                <span className="text-xs font-medium">
                  Estimated purine: ~{result.purineEstimate}mg
                </span>
              </div>

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Meal History</h2>
          {isFetching && <span className="text-xs text-gray-400">Refreshing...</span>}
        </div>

        {/* Date range filter pills */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {DATE_FILTER_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setDateFilter(value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={
                  dateFilter === value
                    ? { backgroundColor: '#2563EB', color: '#ffffff' }
                    : { backgroundColor: '#E5E7EB', color: '#6B7280' }
                }
              >
                {label}
              </button>
            ))}
          </div>
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>

        {/* Daily Purine Risk bar chart */}
        {localChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Daily Purine Risk</h3>
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
              <BarChart data={localChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value} mg`, 'Purines']} />
                <Bar dataKey="purineEstimate" radius={[3, 3, 0, 0]}>
                  {localChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_BAR_COLORS[entry.risk]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Meal cards grid */}
        {localHistory.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
            No meals logged yet. Analyze a meal above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {localHistory.map((entry) => {
              const badge = RISK_BADGE_STYLE[entry.purineLevel];
              const dateLabel = new Date(entry.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: '#E5E7EB' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-sm font-semibold text-gray-800 leading-tight">
                        {formatMealLabel(entry.mealType)} — {dateLabel}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleEditClick(entry)}
                          title="Edit entry"
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => setDeletingId(entry.id)}
                          title="Delete entry"
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
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
