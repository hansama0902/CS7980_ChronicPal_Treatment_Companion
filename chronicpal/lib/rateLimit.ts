import { MAX_DAILY_DIET_ANALYSES } from '@/lib/constants';

// In-memory store. Key format: "userId:YYYY-MM-DD"
const store = new Map<string, number>();

/**
 * Checks and increments the per-user daily analysis counter.
 * Returns allowed=false once the user has reached MAX_DAILY_DIET_ANALYSES.
 */
export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const count = store.get(key) ?? 0;
  if (count >= MAX_DAILY_DIET_ANALYSES) {
    return { allowed: false, remaining: 0 };
  }
  store.set(key, count + 1);
  return { allowed: true, remaining: MAX_DAILY_DIET_ANALYSES - count - 1 };
}
