import { describe, expect, it, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn().mockImplementation(() => ({ _isMockClient: true }));
  return { PrismaClient };
});

import { prisma } from '@/lib/prisma';

describe('prisma singleton', () => {
  it('exports a truthy prisma client', () => {
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });

  it('returns the same instance on repeated imports', async () => {
    const { prisma: a } = await import('@/lib/prisma');
    const { prisma: b } = await import('@/lib/prisma');
    expect(a).toBe(b);
  });
});
