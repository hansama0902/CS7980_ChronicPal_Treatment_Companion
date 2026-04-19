import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMessagesCreate = vi.hoisted(() => vi.fn());
const mockDietEntryCreate = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dietEntry: { create: mockDietEntryCreate },
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

import { analyzeDiet } from '@/services/aiService';

const USER_ID = 'user-1';
const NOW = '2026-04-19T10:00:00.000Z';

const VALID_ANALYSIS = {
  riskLevel: 'LOW',
  purineEstimate: 45,
  foods: [{ name: 'Chicken breast', risk: 'LOW', purine: 45 }],
  suggestion: 'Chicken is a safe choice for gout management.',
};

const mockDietRecord = {
  id: 'd-1',
  userId: USER_ID,
  meal: 'Chicken breast',
  mealType: 'LUNCH',
  purineLevel: 'LOW',
  riskScore: 45,
  aiAnalysis: JSON.stringify(VALID_ANALYSIS),
  date: new Date(NOW),
  createdAt: new Date(NOW),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 9 });
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(VALID_ANALYSIS) }],
  });
  mockDietEntryCreate.mockResolvedValue(mockDietRecord);
});

describe('analyzeDiet', () => {
  it('returns analysis with riskLevel, purineEstimate, foods, and suggestion', async () => {
    const result = await analyzeDiet(USER_ID, 'Chicken breast', 'LUNCH', NOW);
    expect(result.analysis.riskLevel).toBe('LOW');
    expect(result.analysis.purineEstimate).toBe(45);
    expect(result.analysis.foods).toHaveLength(1);
    expect(typeof result.analysis.suggestion).toBe('string');
  });

  it('calls Claude API with the meal description in the prompt', async () => {
    await analyzeDiet(USER_ID, 'Chicken breast', 'LUNCH', NOW);
    expect(mockMessagesCreate).toHaveBeenCalledOnce();
    const arg = mockMessagesCreate.mock.calls[0][0] as {
      messages: Array<{ content: string }>;
    };
    expect(arg.messages[0].content).toContain('Chicken breast');
  });

  it('saves the diet entry to database with correct userId and purineLevel', async () => {
    await analyzeDiet(USER_ID, 'Chicken breast', 'LUNCH', NOW);
    expect(mockDietEntryCreate).toHaveBeenCalledOnce();
    const arg = mockDietEntryCreate.mock.calls[0][0] as {
      data: { userId: string; purineLevel: string };
    };
    expect(arg.data.userId).toBe(USER_ID);
    expect(arg.data.purineLevel).toBe('LOW');
  });

  it('checks rate limit before calling the API', async () => {
    await analyzeDiet(USER_ID, 'Chicken breast', 'LUNCH', NOW);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(USER_ID);
  });

  it('throws when rate limit is exceeded without calling Claude', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    await expect(analyzeDiet(USER_ID, 'Chicken', 'LUNCH', NOW)).rejects.toThrow();
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it('throws BadRequestError when AI returns invalid JSON', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json at all' }],
    });
    await expect(analyzeDiet(USER_ID, 'Chicken', 'LUNCH', NOW)).rejects.toThrow();
  });

  it('throws BadRequestError when riskLevel is not a valid enum value', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ ...VALID_ANALYSIS, riskLevel: 'EXTREME' }) }],
    });
    await expect(analyzeDiet(USER_ID, 'Chicken', 'LUNCH', NOW)).rejects.toThrow();
  });

  it('throws BadRequestError when purineEstimate is not a number', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ ...VALID_ANALYSIS, purineEstimate: 'high' }) }],
    });
    await expect(analyzeDiet(USER_ID, 'Chicken', 'LUNCH', NOW)).rejects.toThrow();
  });
});
