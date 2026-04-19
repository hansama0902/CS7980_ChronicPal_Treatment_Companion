import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { AppError, NotFoundError } from '@/lib/errors';
import { withAuth } from '@/lib/routeAuth';

const mockAuth = auth as ReturnType<typeof vi.fn>;

const BASE_URL = 'http://localhost/api/test';

function makeRequest(url = BASE_URL): NextRequest {
  return new NextRequest(url);
}

function makeCtx(
  params: Record<string, string> = {},
): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve(params) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('withAuth', () => {
  it('returns 401 when auth() resolves to null', async () => {
    mockAuth.mockResolvedValue(null);
    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, error: 'Unauthorized' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 401 when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: null });
    const wrapped = withAuth(vi.fn());

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(401);
  });

  it('returns 401 when session user has no id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const wrapped = withAuth(vi.fn());

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(401);
  });

  it('passes userId and resolved params to handler when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-42' } });
    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const wrapped = withAuth(handler);

    await wrapped(makeRequest(), makeCtx({ id: 'item-1' }));

    expect(handler).toHaveBeenCalledWith('user-42', expect.anything(), { id: 'item-1' });
  });

  it('returns the handler response on success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const wrapped = withAuth(handler);

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(200);
  });

  it('returns AppError status and message when handler throws AppError', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const handler = vi.fn().mockRejectedValue(new NotFoundError('Entry not found'));
    const wrapped = withAuth(handler);

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ success: false, error: 'Entry not found' });
  });

  it('returns AppError with custom statusCode', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const handler = vi.fn().mockRejectedValue(new AppError(409, 'Conflict'));
    const wrapped = withAuth(handler);

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(409);
  });

  it('returns 500 when handler throws a generic error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const handler = vi.fn().mockRejectedValue(new Error('Unexpected DB failure'));
    const wrapped = withAuth(handler);

    const res = await wrapped(makeRequest(), makeCtx());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false, error: 'Internal server error' });
  });
});
