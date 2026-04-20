import {
  MAX_DAILY_DIET_ANALYSES,
  MAX_DAILY_SUMMARIES,
  MAX_LOGIN_ATTEMPTS,
  LOGIN_WINDOW_MINUTES,
} from '@/lib/constants';

// In-memory stores. Key format: "userId:YYYY-MM-DD"
const dietStore = new Map<string, number>();
const summaryStore = new Map<string, number>();

// Login rate limit: key = email, value = { count, windowStart }
const loginStore = new Map<string, { count: number; windowStart: number }>();

/**
 * Checks and increments the per-user daily diet analysis counter.
 * Returns allowed=false once the user has reached MAX_DAILY_DIET_ANALYSES.
 */
export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const count = dietStore.get(key) ?? 0;
  if (count >= MAX_DAILY_DIET_ANALYSES) {
    return { allowed: false, remaining: 0 };
  }
  dietStore.set(key, count + 1);
  return { allowed: true, remaining: MAX_DAILY_DIET_ANALYSES - count - 1 };
}

/**
 * Checks and increments the per-email login attempt counter within a sliding window.
 * Returns allowed=false once the email has exceeded MAX_LOGIN_ATTEMPTS in LOGIN_WINDOW_MINUTES.
 */
export function checkLoginRateLimit(email: string): { allowed: boolean } {
  const now = Date.now();
  const windowMs = LOGIN_WINDOW_MINUTES * 60 * 1000;
  const key = email.toLowerCase();
  const entry = loginStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    loginStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Checks and increments the per-user daily summary generation counter.
 * Returns allowed=false once the user has reached MAX_DAILY_SUMMARIES.
 */
export function checkSummaryRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const count = summaryStore.get(key) ?? 0;
  if (count >= MAX_DAILY_SUMMARIES) {
    return { allowed: false, remaining: 0 };
  }
  summaryStore.set(key, count + 1);
  return { allowed: true, remaining: MAX_DAILY_SUMMARIES - count - 1 };
}
