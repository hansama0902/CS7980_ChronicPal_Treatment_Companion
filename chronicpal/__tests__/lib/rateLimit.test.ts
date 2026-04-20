import { describe, expect, it } from 'vitest';
import { checkRateLimit, checkSummaryRateLimit } from '@/lib/rateLimit';

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

describe('checkSummaryRateLimit', () => {
  it('allows the first request and returns 4 remaining', () => {
    const result = checkSummaryRateLimit('sl-user-a');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining count across consecutive calls', () => {
    checkSummaryRateLimit('sl-user-b');
    checkSummaryRateLimit('sl-user-b');
    const third = checkSummaryRateLimit('sl-user-b');
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(2);
  });

  it('blocks after 5 requests in one day', () => {
    for (let i = 0; i < 5; i++) {
      checkSummaryRateLimit('sl-user-c');
    }
    const blocked = checkSummaryRateLimit('sl-user-c');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('5th allowed request returns 0 remaining', () => {
    for (let i = 0; i < 4; i++) {
      checkSummaryRateLimit('sl-user-d');
    }
    const fifth = checkSummaryRateLimit('sl-user-d');
    expect(fifth.allowed).toBe(true);
    expect(fifth.remaining).toBe(0);
  });

  it('limits are per-user — different users have independent counters', () => {
    for (let i = 0; i < 5; i++) {
      checkSummaryRateLimit('sl-user-e');
    }
    const result = checkSummaryRateLimit('sl-user-f');
    expect(result.allowed).toBe(true);
  });
});
