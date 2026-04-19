import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { IDietAnalysisResult } from '@/types/diet';
import { BadRequestError, TooManyRequestsError } from '@/lib/errors';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

function sanitizeMeal(meal: string): string {
  return meal
    .replace(/[<>{}[\]\\]/g, '')
    .trim()
    .slice(0, 500);
}

function parseDietAnalysisResponse(text: string): IDietAnalysisResult {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
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

const SYSTEM_PROMPT = `You are a clinical nutrition assistant specializing in gout management.
Return ONLY a valid JSON object with no additional text, markdown, or explanation:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "purineEstimate": <total estimated purines in mg, as a number>,
  "foods": [{"name": "<food name>", "risk": "LOW" | "MEDIUM" | "HIGH", "purine": <mg as number>}],
  "suggestion": "<one actionable dietary suggestion>"
}

Purine guidelines for gout management:
- LOW: < 100 mg/serving — safe
- MEDIUM: 100–200 mg/serving — moderate caution
- HIGH: > 200 mg/serving — avoid to prevent flares`;

/**
 * Analyzes a meal for purine/gout risk using Gemini 1.5 Flash.
 * Accepts an optional base64 image for photo-based analysis.
 * Enforces per-user daily rate limit and persists the result.
 * @throws TooManyRequestsError if the daily limit is exceeded
 * @throws BadRequestError if the AI response cannot be parsed
 */
export async function analyzeDiet(
  userId: string,
  meal: string,
  mealType: string,
  date: string,
  imageBase64?: string,
  imageMimeType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
): Promise<{ dietEntry: object; analysis: IDietAnalysisResult }> {
  const { allowed } = checkRateLimit(userId);
  if (!allowed) {
    throw new TooManyRequestsError('Rate limit exceeded: max 10 analyses per day');
  }

  const sanitizedMeal = sanitizeMeal(meal);
  const userText = sanitizedMeal
    ? `Analyze this ${mealType.toLowerCase()} for purine content: ${sanitizedMeal}`
    : `Analyze this ${mealType.toLowerCase()} meal photo for purine content.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const parts: Part[] = [];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType ?? 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  parts.push({ text: userText });

  const result = await model.generateContent(parts);
  const responseText = result.response.text();

  const analysis = parseDietAnalysisResponse(responseText);

  const mealLabel = sanitizedMeal || '(photo)';
  const dietEntry = await prisma.dietEntry.create({
    data: {
      userId,
      meal: mealLabel,
      mealType: mealType as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK',
      purineLevel: analysis.riskLevel,
      riskScore: analysis.purineEstimate,
      aiAnalysis: JSON.stringify(analysis),
      date: new Date(date),
    },
  });

  return { dietEntry, analysis };
}
