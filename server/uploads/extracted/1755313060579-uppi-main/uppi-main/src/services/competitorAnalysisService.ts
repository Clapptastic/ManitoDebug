/**
 * LEGACY SERVICE - DEPRECATED
 * This file is now a backward compatibility layer that redirects to the unified service.
 * All new development should use src/services/competitor-analysis/unified.ts
 * 
 * SINGLE SOURCE OF TRUTH: src/services/competitor-analysis/unified.ts
 */

import { unifiedCompetitorAnalysisService } from './competitor-analysis/unified';
import type { CompetitorAnalysis, CompetitorAnalysisResult, SavedAnalysis } from '@/types/competitor-analysis';
import type { ApiKeyType } from '@/types/api-keys/unified';

// Legacy class for backward compatibility only - all methods delegate to unified service
class CompetitorAnalysisService {
  async getAnalyses(): Promise<CompetitorAnalysis[]> {
    return unifiedCompetitorAnalysisService.getAnalyses();
  }

  async getAnalysisById(id: string): Promise<CompetitorAnalysis | null> {
    return unifiedCompetitorAnalysisService.getAnalysisById(id);
  }

  async startAnalysis(sessionId: string, competitors: string[], providersSelected?: string[], models?: Record<string, string>): Promise<any> {
    return unifiedCompetitorAnalysisService.startAnalysis(sessionId, competitors, providersSelected, models);
  }

  async saveAnalysis(sessionId: string, analysisData: Partial<CompetitorAnalysis>): Promise<CompetitorAnalysis> {
    return unifiedCompetitorAnalysisService.saveAnalysis(sessionId, analysisData);
  }

  async updateAnalysis(id: string, updates: Partial<CompetitorAnalysis>): Promise<CompetitorAnalysis> {
    return unifiedCompetitorAnalysisService.updateAnalysis(id, updates);
  }

  async refreshAnalysis(id: string): Promise<CompetitorAnalysis> {
    const result = await unifiedCompetitorAnalysisService.getAnalysisById(id);
    if (!result) throw new Error('Analysis not found');
    return result;
  }

  async exportAnalysis(id: string): Promise<Blob> {
    return unifiedCompetitorAnalysisService.exportAnalysis(id);
  }

  async checkApiKeyRequirements(): Promise<{ hasRequiredKeys: boolean; missingKeys: string[] }> {
    return unifiedCompetitorAnalysisService.checkApiKeyRequirements();
  }

  async getAvailableProviders(): Promise<string[]> {
    return unifiedCompetitorAnalysisService.getAvailableProviders();
  }

  async deleteAnalysis(id: string): Promise<void> {
    return unifiedCompetitorAnalysisService.deleteAnalysis(id);
  }

  async getAvailableApiKeys(): Promise<Record<string, 'available'>> {
    return unifiedCompetitorAnalysisService.getAvailableApiKeys();
  }

  async analyzeWithAllAvailableApis(competitor: string, enabledApis?: string[]): Promise<unknown> {
    if (!competitor || typeof competitor !== 'string') {
      throw new Error('Invalid competitor name');
    }

    const available = await this.getAvailableApiKeys();
    const availableList = Object.keys(available);
    const apisToUse = (enabledApis && enabledApis.length > 0)
      ? availableList.filter(a => enabledApis.includes(a))
      : availableList;

    if (apisToUse.length === 0) {
      throw new Error('No API keys available. Please configure keys in Settings.');
    }

    const sessionId = (globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`);
    return this.startAnalysis(sessionId, [competitor], apisToUse);
  }

  async refreshCompetitorAnalysis(analysisId: string): Promise<boolean> {
    return unifiedCompetitorAnalysisService.refreshCompetitorAnalysis(analysisId);
  }

  async consolidateCompetitorAnalysis(analysisId: string): Promise<any> {
    return unifiedCompetitorAnalysisService.consolidateCompetitorAnalysis(analysisId);
  }

  async getAvailableProvidersTyped(): Promise<ApiKeyType[]> {
    const providers = await this.getAvailableProviders();
    return providers as ApiKeyType[];
  }

  async validateAllProviders(): Promise<Map<ApiKeyType, boolean>> {
    return unifiedCompetitorAnalysisService.validateAllProviders();
  }
}

export const competitorAnalysisService = new CompetitorAnalysisService();
export type { CompetitorAnalysis, CompetitorAnalysisResult, SavedAnalysis } from '@/types/competitor-analysis';