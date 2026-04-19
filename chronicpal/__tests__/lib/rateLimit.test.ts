import { describe, expect, it } from 'vitest';
import { checkRateLimit } from '@/lib/rateLimit';

// Each test uses a unique userId so in-memory store entries don't conflict.

describe('checkRateLimit', () => {
  it('allows the first request and returns 9 remaining', () => {
    const result = checkRateLimit('rl-user-a');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('tracks remaining count across consecutive calls', () => {
    checkRateLimit('rl-user-b');
    checkRateLimit('rl-user-b');
    const third = checkRateLimit('rl-user-b');
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(7);
  });

  it('blocks after 10 requests in one day', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('rl-user-c');
    }
    const blocked = checkRateLimit('rl-user-c');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('10th allowed request returns 0 remaining', () => {
    for (let i = 0; i < 9; i++) {
      checkRateLimit('rl-user-d');
    }
    const tenth = checkRateLimit('rl-user-d');
    expect(tenth.allowed).toBe(true);
    expect(tenth.remaining).toBe(0);
  });

  it('limits are per-user — different users have independent counters', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('rl-user-e');
    }
    const result = checkRateLimit('rl-user-f');
    expect(result.allowed).toBe(true);
  });
});
