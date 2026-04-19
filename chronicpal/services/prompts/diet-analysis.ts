/**
 * Builds the Claude prompt for purine/diet risk analysis.
 * Requests strict JSON output to simplify parsing.
 */
export function buildDietAnalysisPrompt(meal: string, mealType: string): string {
  return `You are a clinical nutrition assistant specializing in gout management. Analyze the following ${mealType.toLowerCase()} for purine content.

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
- HIGH: > 200 mg/serving — avoid to prevent flares

Meal description: ${meal}`;
}
