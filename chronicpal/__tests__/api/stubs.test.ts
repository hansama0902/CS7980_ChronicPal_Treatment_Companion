import { describe, expect, it } from 'vitest';
import { GET as dietGET } from '@/app/api/diet/route';
import { GET as summaryGET } from '@/app/api/summary/route';

describe('GET /api/diet', () => {
  it('returns 501 Not Implemented', async () => {
    const res = dietGET();
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Not implemented');
  });
});

describe('GET /api/summary', () => {
  it('returns 501 Not Implemented', async () => {
    const res = summaryGET();
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Not implemented');
  });
});
