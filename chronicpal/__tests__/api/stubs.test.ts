import { describe, expect, it } from 'vitest';
import { GET as summaryGET } from '@/app/api/summary/route';

describe('GET /api/summary', () => {
  it('returns 501 Not Implemented', async () => {
    const res = summaryGET();
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Not implemented');
  });
});
