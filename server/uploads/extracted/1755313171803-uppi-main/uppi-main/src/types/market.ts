
// Define MarketResearchStep as an enum to fix type conversion issues
export enum MarketResearchStep {
  INITIALIZING = 'initializing',
  INPUTTING = 'inputting',
  PROCESSING = 'processing',
  ANALYZING = 'analyzing',
  VISUALIZING = 'visualizing',
  COMPLETED = 'completed'
}

// Market research step information interface with properties needed for UI rendering
export interface MarketResearchStepInfo {
  id: MarketResearchStep;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  progress: number;
}

// Survey response interface
export interface SurveyResponse {
  id: string;
  question: string;
  answer: string;
  respondentId: string;
  timestamp: string;
}

// Trend data interface
export interface TrendData {
  period: string;
  interest: number;
  growth: number;
}
