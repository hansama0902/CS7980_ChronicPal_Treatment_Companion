import { describe, expect, it } from 'vitest';
import {
  buildVisitSummaryPrompt,
  VISIT_SUMMARY_SYSTEM_PROMPT,
} from '@/services/prompts/visit-summary';

const baseStats = {
  periodDays: 90,
  infusionsCompleted: 2,
  hasNotedReactions: false,
  uricAcidReadings: 3,
  latestUricAcidMgdl: 5.5,
  percentChangeUricAcid: -8.3,
  targetUricAcidMgdl: 6.0,
  aboveTarget: false,
  totalSymptomEvents: 5,
  averageSeverity: 3.2,
  severeEventCount: 0,
  flareFreeDayPercent: 85,
  totalMealsLogged: 60,
  lowPurinePercent: 75,
  highRiskMealCount: 5,
};

describe('VISIT_SUMMARY_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof VISIT_SUMMARY_SYSTEM_PROMPT).toBe('string');
    expect(VISIT_SUMMARY_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });
});

describe('buildVisitSummaryPrompt', () => {
  it('includes the period days in the prompt', () => {
    const prompt = buildVisitSummaryPrompt(baseStats);
    expect(prompt).toContain('90 days');
  });

  it('includes infusion count', () => {
    const prompt = buildVisitSummaryPrompt(baseStats);
    expect(prompt).toContain('2 infusion');
  });

  it('shows "none documented" when hasNotedReactions is false', () => {
    const prompt = buildVisitSummaryPrompt(baseStats);
    expect(prompt).toContain('none documented');
  });

  it('shows "yes" when hasNotedReactions is true', () => {
    const prompt = buildVisitSummaryPrompt({ ...baseStats, hasNotedReactions: true });
    expect(prompt).toContain('yes');
  });

  it('shows "no data" when latestUricAcidMgdl is null', () => {
    const prompt = buildVisitSummaryPrompt({ ...baseStats, latestUricAcidMgdl: null });
    expect(prompt).toContain('no data');
  });

  it('shows "N/A" when averageSeverity is null', () => {
    const prompt = buildVisitSummaryPrompt({ ...baseStats, averageSeverity: null });
    expect(prompt).toContain('N/A');
  });

  it('shows "insufficient data" when percentChangeUricAcid is null', () => {
    const prompt = buildVisitSummaryPrompt({ ...baseStats, percentChangeUricAcid: null });
    expect(prompt).toContain('insufficient data');
  });

  it('shows "above target" when aboveTarget is true', () => {
    const prompt = buildVisitSummaryPrompt({ ...baseStats, aboveTarget: true });
    expect(prompt).toContain('above target');
  });

  it('shows "at or below target" when aboveTarget is false', () => {
    const prompt = buildVisitSummaryPrompt(baseStats);
    expect(prompt).toContain('at or below target');
  });

  it('includes uric acid value when provided', () => {
    const prompt = buildVisitSummaryPrompt(baseStats);
    expect(prompt).toContain('5.5 mg/dL');
  });
});
