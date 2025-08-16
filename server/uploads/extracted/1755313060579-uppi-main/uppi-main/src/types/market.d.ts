
export interface MarketSizeData {
  tam: number;  // Total Addressable Market
  sam: number;  // Serviceable Addressable Market
  som: number;  // Serviceable Obtainable Market
}

export interface MarketSizeCalculation {
  id: string;
  userId: string;
  industry: string;
  region: string;
  tam: number;
  sam: number;
  som: number;
  notes?: string;
  sourceFiles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  question: string;
  responses: {
    answer: string;
    count: number;
  }[];
}

export interface TrendData {
  period: string;
  interest: number;
  growth: number;
}

export interface MarketResearchStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  route?: string;
}
