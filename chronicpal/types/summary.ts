export interface ILabTrendPoint {
  date: string;
  value: number;
}

export interface ISevereFlare {
  date: string;
  score: number;
  type: string;
}

export interface IHighRiskItem {
  meal: string;
  count: number;
}

export interface ISummaryRawData {
  treatmentSummary: {
    infusionsCount: number;
    infusionDates: string[];
    hasReactions: boolean;
    nextScheduled: string | null;
  };
  labTrends: {
    uricAcidTrend: ILabTrendPoint[];
    latestUricAcid: number | null;
    percentChange: number | null;
    aboveTarget: boolean;
    targetMgdl: number;
  };
  symptomOverview: {
    avgPainScore: number | null;
    severeFlares: ISevereFlare[];
    flareFreeDays: number;
    totalDays: number;
  };
  dietCompliance: {
    compliancePercent: number;
    totalMeals: number;
    lowPurineMeals: number;
    highRiskItems: IHighRiskItem[];
  };
}

export interface ISummaryNarrative {
  treatmentSummary: string;
  labTrends: string;
  symptomOverview: string;
  dietCompliance: string;
  keyConcerns: string[];
}

export interface ISummaryResult {
  rawData: ISummaryRawData;
  aiNarrative: ISummaryNarrative;
  dateRange: { start: string; end: string };
  generatedAt: string;
}
