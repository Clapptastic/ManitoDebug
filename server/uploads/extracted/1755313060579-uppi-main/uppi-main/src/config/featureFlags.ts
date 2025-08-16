
export interface FeatureFlags {
  competitorAnalysis: boolean;
  codeEmbeddings: boolean;
  microservices: boolean;
  edgeFunctionMonitoring: boolean;
  databaseMonitoring: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  competitorAnalysis: true,
  codeEmbeddings: true,
  microservices: false,
  edgeFunctionMonitoring: true,
  databaseMonitoring: true,
};

export async function getFeatureFlags(): Promise<FeatureFlags> {
  // In a real implementation, this might fetch from a backend
  // For now, return the default flags
  return defaultFeatureFlags;
}
