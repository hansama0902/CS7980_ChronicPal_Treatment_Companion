import { describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({
  handlers: {
    GET: vi.fn().mockResolvedValue(new Response('ok', { status: 200 })),
    POST: vi.fn().mockResolvedValue(new Response('ok', { status: 200 })),
  },
}));

import { GET, POST } from '@/app/api/auth/[...nextauth]/route';

describe('[...nextauth] route', () => {
  it('exports a GET handler', () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('exports a POST handler', () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });
});
