
export type SubscriptionTier = 'individual' | 'pro' | 'business' | 'enterprise';

export type SupportLevel = 'email' | 'priority' | '24/7_priority' | 'dedicated';

export interface SubscriptionFeature {
  id: string;
  tier: SubscriptionTier;
  feature_name: string;
  feature_limit: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTierInfo {
  name: SubscriptionTier;
  description: string;
  features: string[];
  monthlyPrice: number;
  supportLevel: SupportLevel;
}

export interface SupportEntitlement {
  hasEmailSupport: boolean;
  hasPrioritySupport: boolean;
  has24x7Support: boolean;
  hasDedicatedManager: boolean;
  responseTimeHours: number;
}

