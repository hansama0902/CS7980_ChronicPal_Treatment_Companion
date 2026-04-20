export const VISIT_SUMMARY_SYSTEM_PROMPT = `You are a clinical AI assistant helping patients prepare for healthcare provider visits.
You receive aggregated health statistics (no patient identifiers) and generate a structured pre-visit summary.
Return ONLY a valid JSON object with no markdown, code blocks, or additional text:
{
  "treatmentSummary": "<2-3 sentence narrative about treatment progress and adherence>",
  "labTrends": "<2-3 sentence narrative about lab value trends and target comparison>",
  "symptomOverview": "<2-3 sentence narrative about symptom patterns and quality of life>",
  "dietCompliance": "<2-3 sentence narrative about dietary compliance and recommendations>",
  "keyConcerns": ["<actionable concern 1>", "<actionable concern 2>", "<actionable concern 3>"]
}
Guidelines:
- Be factual, concise, and actionable
- Use plain language suitable for patients to share with their doctor
- For keyConcerns: list 2-4 specific topics the patient should raise with their provider
- Do NOT include any patient identifiers, names, or raw PHI
- Always recommend discussing results with a healthcare provider`;

/**
 * Builds the user message for visit summary generation from anonymized aggregate stats.
 * No patient identifiers are included — only statistical summaries.
 */
export function buildVisitSummaryPrompt(aggregatedStats: {
  periodDays: number;
  infusionsCompleted: number;
  hasNotedReactions: boolean;
  uricAcidReadings: number;
  latestUricAcidMgdl: number | null;
  percentChangeUricAcid: number | null;
  targetUricAcidMgdl: number;
  aboveTarget: boolean;
  totalSymptomEvents: number;
  averageSeverity: number | null;
  severeEventCount: number;
  flareFreeDayPercent: number;
  totalMealsLogged: number;
  lowPurinePercent: number;
  highRiskMealCount: number;
}): string {
  return `Generate a pre-visit summary from these aggregated health statistics for the past ${aggregatedStats.periodDays} days:

TREATMENT: ${aggregatedStats.infusionsCompleted} infusion(s) completed. Noted reactions: ${aggregatedStats.hasNotedReactions ? 'yes' : 'none documented'}.

LAB RESULTS: ${aggregatedStats.uricAcidReadings} uric acid reading(s). Latest: ${aggregatedStats.latestUricAcidMgdl !== null ? `${aggregatedStats.latestUricAcidMgdl} mg/dL` : 'no data'}. Target: ${aggregatedStats.targetUricAcidMgdl} mg/dL (${aggregatedStats.aboveTarget ? 'above target' : 'at or below target'}). Change from period start: ${aggregatedStats.percentChangeUricAcid !== null ? `${aggregatedStats.percentChangeUricAcid.toFixed(1)}%` : 'insufficient data'}.

SYMPTOMS: ${aggregatedStats.totalSymptomEvents} symptom event(s). Average severity: ${aggregatedStats.averageSeverity !== null ? aggregatedStats.averageSeverity.toFixed(1) : 'N/A'}/10. Severe events (≥7/10): ${aggregatedStats.severeEventCount}. Flare-free days: ${aggregatedStats.flareFreeDayPercent.toFixed(0)}% of period.

DIET: ${aggregatedStats.totalMealsLogged} meals logged. Low-purine compliant: ${aggregatedStats.lowPurinePercent}%. High-risk meals: ${aggregatedStats.highRiskMealCount}.`;
}
