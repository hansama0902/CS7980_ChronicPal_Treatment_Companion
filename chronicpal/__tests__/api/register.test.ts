import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/auth/register/route';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('returns 201 and user data on successful registration', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const res = await POST(makePostRequest({ email: 'user@example.com', password: 'Password1!' }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('user@example.com');
  });

  it('returns 400 when email is invalid', async () => {
    const res = await POST(makePostRequest({ email: 'not-an-email', password: 'Password1!' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('returns 400 when password is too short', async () => {
    const res = await POST(makePostRequest({ email: 'user@example.com', password: 'abc' }));

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('returns 400 when email is already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'user@example.com' });

    const res = await POST(makePostRequest({ email: 'user@example.com', password: 'Password1!' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email already registered');
  });

  it('returns 500 on unexpected database error', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error('DB crash'));

    const res = await POST(makePostRequest({ email: 'user@example.com', password: 'Password1!' }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Internal server error');
  });
});
