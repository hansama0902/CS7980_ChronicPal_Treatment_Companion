import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { checkSummaryRateLimit } from '@/lib/rateLimit';
import { URIC_ACID_TARGET_MGDL } from '@/lib/constants';
import { BadRequestError, TooManyRequestsError } from '@/lib/errors';
import { VISIT_SUMMARY_SYSTEM_PROMPT, buildVisitSummaryPrompt } from './prompts/visit-summary';
import type { ISummaryResult, ISummaryNarrative } from '@/types/summary';

const anthropicClient = new Anthropic({ maxRetries: 1 });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/** Tries Gemini 2.5 Pro first; falls back to Claude on any error. */
async function generateNarrativeText(userPrompt: string): Promise<string> {
  try {
    const model = geminiClient.getGenerativeModel({
      model: 'gemini-2.5-pro',
      systemInstruction: VISIT_SUMMARY_SYSTEM_PROMPT,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch {
    const message = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: VISIT_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const textBlock = message.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new BadRequestError('No text response from AI');
    }
    return textBlock.text;
  }
}

function parseNarrativeResponse(text: string): ISummaryNarrative {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new BadRequestError('AI returned non-JSON response for summary');
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.treatmentSummary !== 'string')
    throw new BadRequestError('Missing treatmentSummary');
  if (typeof obj.labTrends !== 'string') throw new BadRequestError('Missing labTrends');
  if (typeof obj.symptomOverview !== 'string') throw new BadRequestError('Missing symptomOverview');
  if (typeof obj.dietCompliance !== 'string') throw new BadRequestError('Missing dietCompliance');
  if (!Array.isArray(obj.keyConcerns)) throw new BadRequestError('Missing keyConcerns');
  return obj as unknown as ISummaryNarrative;
}

/**
 * Generates a PHI-safe pre-visit summary for the given date range.
 * Aggregates data from treatments, labs, symptoms, and diet, then sends
 * only anonymized statistics to Claude for narrative generation.
 * @throws TooManyRequestsError if the daily summary limit is exceeded
 * @throws BadRequestError if the AI response cannot be parsed
 */
export async function generateVisitSummary(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<ISummaryResult> {
  const { allowed } = checkSummaryRateLimit(userId);
  if (!allowed) {
    throw new TooManyRequestsError('Rate limit exceeded: max 5 summaries per day');
  }

  const [treatments, labs, symptoms, dietEntries, nextTreatment] = await Promise.all([
    prisma.treatmentEntry.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
      select: { date: true, type: true, notes: true },
    }),
    prisma.labResult.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
      select: { date: true, uricAcidLevel: true },
    }),
    prisma.symptomEntry.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
      select: { date: true, severity: true, symptomType: true },
    }),
    prisma.dietEntry.findMany({
      where: { userId, date: { gte: startDate, lte: endDate }, deletedAt: null },
      select: { meal: true, purineLevel: true },
    }),
    prisma.treatmentEntry.findFirst({
      where: { userId, type: 'INFUSION', date: { gt: endDate } },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
  ]);

  // --- Treatment aggregation ---
  const infusions = treatments.filter((t) => t.type === 'INFUSION');
  const infusionDates = infusions.map((t) => t.date.toISOString().split('T')[0]);
  const hasReactions = infusions.some((t) => t.notes && t.notes.trim().length > 0);
  const nextScheduled = nextTreatment ? nextTreatment.date.toISOString().split('T')[0] : null;

  // --- Lab aggregation ---
  const uricAcidTrend = labs.map((l) => ({
    date: l.date.toISOString().split('T')[0],
    value: l.uricAcidLevel,
  }));
  const latestUricAcid = labs.length > 0 ? labs[labs.length - 1].uricAcidLevel : null;
  const earliestUricAcid = labs.length > 0 ? labs[0].uricAcidLevel : null;
  const percentChange =
    earliestUricAcid !== null && latestUricAcid !== null && earliestUricAcid !== 0
      ? ((latestUricAcid - earliestUricAcid) / earliestUricAcid) * 100
      : null;
  const aboveTarget = latestUricAcid !== null && latestUricAcid > URIC_ACID_TARGET_MGDL;

  // --- Symptom aggregation ---
  const avgPainScore =
    symptoms.length > 0 ? symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length : null;
  const severeFlares = symptoms
    .filter((s) => s.severity >= 7)
    .map((s) => ({
      date: s.date.toISOString().split('T')[0],
      score: s.severity,
      type: s.symptomType,
    }));
  const symptomDays = new Set(symptoms.map((s) => s.date.toISOString().split('T')[0]));
  const totalDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const flareFreeDays = Math.max(0, totalDays - symptomDays.size);

  // --- Diet aggregation ---
  const totalMeals = dietEntries.length;
  const lowPurineMeals = dietEntries.filter((d) => d.purineLevel === 'LOW').length;
  const compliancePercent = totalMeals > 0 ? Math.round((lowPurineMeals / totalMeals) * 100) : 0;
  const highRiskCounts: Record<string, number> = {};
  for (const d of dietEntries.filter((d) => d.purineLevel === 'HIGH')) {
    highRiskCounts[d.meal] = (highRiskCounts[d.meal] ?? 0) + 1;
  }
  const highRiskItems = Object.entries(highRiskCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([meal, count]) => ({ meal, count }));

  // --- Build anonymized stats for AI (no patient identifiers) ---
  const aggregatedStats = {
    periodDays: totalDays,
    infusionsCompleted: infusions.length,
    hasNotedReactions: hasReactions,
    uricAcidReadings: labs.length,
    latestUricAcidMgdl: latestUricAcid,
    percentChangeUricAcid: percentChange,
    targetUricAcidMgdl: URIC_ACID_TARGET_MGDL,
    aboveTarget,
    totalSymptomEvents: symptoms.length,
    averageSeverity: avgPainScore,
    severeEventCount: severeFlares.length,
    flareFreeDayPercent: (flareFreeDays / totalDays) * 100,
    totalMealsLogged: totalMeals,
    lowPurinePercent: compliancePercent,
    highRiskMealCount: dietEntries.filter((d) => d.purineLevel === 'HIGH').length,
  };

  const userPrompt = buildVisitSummaryPrompt(aggregatedStats);

  const rawText = await generateNarrativeText(userPrompt);
  const aiNarrative = parseNarrativeResponse(rawText);

  return {
    rawData: {
      treatmentSummary: {
        infusionsCount: infusions.length,
        infusionDates,
        hasReactions,
        nextScheduled,
      },
      labTrends: {
        uricAcidTrend,
        latestUricAcid,
        percentChange,
        aboveTarget,
        targetMgdl: URIC_ACID_TARGET_MGDL,
      },
      symptomOverview: { avgPainScore, severeFlares, flareFreeDays, totalDays },
      dietCompliance: { compliancePercent, totalMeals, lowPurineMeals, highRiskItems },
    },
    aiNarrative,
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    generatedAt: new Date().toISOString(),
  };
}
