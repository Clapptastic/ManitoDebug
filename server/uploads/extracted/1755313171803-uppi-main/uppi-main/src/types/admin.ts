
export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  affiliate_code: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  clicks: number;
  conversions: number;
  revenue: number;
  created_at: string;
  updated_at: string;
  program_name: string;
}

export interface AffiliateAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  link_id?: string;
  created_at: string;
  resolved: boolean;
  program_name?: string;
  alert_type?: 'warning' | 'error' | 'info' | 'success';
  status?: string;
  is_dismissed?: boolean;
}

export interface AffiliateProgram {
  id: string;
  name: string;
  description: string;
  commission_rate: number;
  payment_terms: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  links_count?: number;
  total_clicks?: number;
  total_conversions?: number;
  conversion_rate?: number;
  // Extended fields for provider-specific affiliate integrations
  provider?: string;
  program_name?: string;
  default_url?: string | null;
  affiliate_url?: string | null;
  is_active?: boolean;
  domain?: string | null;
}

// Suggestion captured when users click external links without a matching program
export interface AffiliateLinkSuggestion {
  id: string;
  domain: string;
  original_url: string;
  status: 'new' | 'reviewed' | 'ignored';
  detected_program_name?: string | null;
  provider?: string | null;
  signup_url?: string | null;
  created_at: string;
  created_by: string;
}

export interface Website {
  id: string;
  name: string;
  domain: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface WebsiteMetrics {
  website_id: string;
  pageviews: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  date: string;
}

// Admin API Response interface
export interface AdminApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
  message?: string;
}
