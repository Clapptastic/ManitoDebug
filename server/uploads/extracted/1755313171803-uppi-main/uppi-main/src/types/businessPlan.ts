export interface ExecutiveSummary {
  overview: string;
  vision: string;
  mission: string;
  objectives: string[];
  keySuccessFactors: string[];
}

export interface MarketSize {
  tam: string;
  sam: string;
  som: string;
}

export interface MarketAnalysis {
  industryOverview: string;
  targetMarket: string[];
  marketSize: MarketSize;
  competitorAnalysis: string[];
  marketTrends: string[];
}

export interface BusinessModel {
  valueProposition: string;
  revenueStreams: string[];
  costStructure: string[];
  keyPartners: string[];
  keyActivities: string[];
}

export interface Roadmap {
  phase1: string;
  phase2: string;
  phase3: string;
}

export interface ProductDevelopment {
  productDescription: string;
  developmentPhases: string[];
  timeline: string;
  resources: string[];
  mvpFeatures: string[];
  roadmap: Roadmap;
}

export interface MarketingStrategy {
  targetAudience: string;
  marketingChannels: string[];
  marketingBudget: number;
  campaigns: string[];
}

export interface TeamStructure {
  [role: string]: number;
}

export interface OperationsManagement {
  operationalStructure: string;
  processes: string[];
  qualityControl: string[];
  suppliers: string[];
  teamStructure: TeamStructure;
  keyOperations: string[];
}

export interface YearData {
  revenue: number;
  expenses: number;
  netIncome: number;
  customers: number;
}

export interface FundingRequirements {
  seedRound: number;
  seriesA: number;
}

export interface FinancialProjections {
  revenueProjections: number[];
  expenseProjections: number[];
  profitabilityAnalysis: string;
  fundingRequirements: FundingRequirements;
  year1: YearData;
  year2: YearData;
  year3: YearData;
}

export interface RiskAnalysis {
  identifiedRisks: string[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
  marketRisks: string[];
  technicalRisks: string[];
  financialRisks: string[];
}

export interface Implementation {
  milestones: string[];
  timeline: string;
  responsibilities: string[];
  successMetrics: string[];
}

export interface BusinessPlan {
  executiveSummary: ExecutiveSummary;
  marketAnalysis: MarketAnalysis;
  businessModel: BusinessModel;
  productDevelopment: ProductDevelopment;
  marketingStrategy: MarketingStrategy;
  operationsManagement: OperationsManagement;
  financialProjections: FinancialProjections;
  riskAnalysis: RiskAnalysis;
  implementation: Implementation;
}

export interface BusinessPlanFormData {
  businessName: string;
  industry: string;
  businessModel: string;
}