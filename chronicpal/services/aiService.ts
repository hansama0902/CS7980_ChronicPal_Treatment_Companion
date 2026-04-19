import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { buildDietAnalysisPrompt } from './prompts/diet-analysis';
import { IDietAnalysisResult } from '@/types/diet';
import { BadRequestError, TooManyRequestsError } from '@/lib/errors';

const client = new Anthropic();

function sanitizeMeal(meal: string): string {
  return meal
    .replace(/[<>{}[\]\\]/g, '')
    .trim()
    .slice(0, 500);
}

function parseDietAnalysisResponse(text: string): IDietAnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BadRequestError('AI returned non-JSON response');
  }
  const obj = parsed as Record<string, unknown>;
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(obj.riskLevel as string)) {
    throw new BadRequestError('AI returned invalid riskLevel');
  }
  if (typeof obj.purineEstimate !== 'number') {
    throw new BadRequestError('AI returned invalid purineEstimate');
  }
  if (!Array.isArray(obj.foods)) {
    throw new BadRequestError('AI returned invalid foods array');
  }
  if (typeof obj.suggestion !== 'string') {
    throw new BadRequestError('AI returned invalid suggestion');
  }
  return obj as unknown as IDietAnalysisResult;
}

/**
 * Analyzes a meal for purine/gout risk using Claude AI.
 * Enforces per-user daily rate limit. Persists the result to DietEntry.
 * @throws TooManyRequestsError if the daily limit is exceeded
 * @throws BadRequestError if the AI response cannot be parsed
 */
export async function analyzeDiet(
  userId: string,
  meal: string,
  mealType: string,
  date: string,
): Promise<{ dietEntry: object; analysis: IDietAnalysisResult }> {
  const { allowed } = checkRateLimit(userId);
  if (!allowed) {
    throw new TooManyRequestsError('Rate limit exceeded: max 10 analyses per day');
  }

  const sanitizedMeal = sanitizeMeal(meal);
  const prompt = buildDietAnalysisPrompt(sanitizedMeal, mealType);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((c) => c.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new BadRequestError('No text response from AI');
  }

  const analysis = parseDietAnalysisResponse(textBlock.text);

  const dietEntry = await prisma.dietEntry.create({
    data: {
      userId,
      meal: sanitizedMeal,
      mealType: mealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
      purineLevel: analysis.riskLevel,
      riskScore: analysis.purineEstimate,
      aiAnalysis: JSON.stringify(analysis),
      date: new Date(date),
    },
  });

  return { dietEntry, analysis };
}
