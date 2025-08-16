/**
 * Competitor Analysis Enums
 */

import { AnalysisStatus as CompetitorStatusEnum } from '@/types/core';

export { CompetitorStatusEnum };


export enum AnalysisStepEnum {
  INITIALIZE = 'initialize',
  PREPARING = 'preparing',
  QUERYING = 'querying',
  PROCESSING = 'processing',
  ANALYZING = 'analyzing',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

export type CompetitorStatus = keyof typeof CompetitorStatusEnum;
export type AnalysisStep = keyof typeof AnalysisStepEnum;