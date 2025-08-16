/**
 * Customer Support System Types
 * Complete type definitions for Phase 11 implementation
 */

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'general';
export type MessageType = 'text' | 'system' | 'attachment';
export type FeedbackType = 'helpful' | 'not_helpful';
export type SupportRole = 'agent' | 'supervisor' | 'manager' | 'admin';

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to: string | null;
  resolution: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  
  // Joined data
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  assignee?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  messages?: SupportTicketMessage[];
  message_count?: number;
  last_message_at?: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  attachments: MessageAttachment[];
  message_type: MessageType;
  metadata: Record<string, any>;
  created_at: string;
  
  // Joined data
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface MessageAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  thumbnail_url?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  slug: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  search_keywords: string[];
  meta_description: string | null;
  created_by: string;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Calculated fields
  helpfulness_score?: number;
  author?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface KnowledgeBaseFeedback {
  id: string;
  article_id: string;
  user_id: string | null;
  feedback_type: FeedbackType;
  feedback_text: string | null;
  user_ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SupportMetrics {
  id: string;
  metric_date: string;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  avg_resolution_time: string | null;
  first_response_time: string | null;
  customer_satisfaction_score: number | null;
  ticket_volume_by_category: Record<string, number>;
  agent_performance: Record<string, any>;
  knowledge_base_views: number;
  knowledge_base_helpfulness: number | null;
  created_at: string;
}

export interface SupportTeamMember {
  id: string;
  user_id: string;
  role: SupportRole;
  department: string;
  is_active: boolean;
  max_concurrent_tickets: number;
  skills: string[];
  languages: string[];
  timezone: string;
  working_hours: Record<string, any>;
  performance_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  current_ticket_count?: number;
  avg_resolution_time?: string;
  customer_satisfaction?: number;
}

export interface TicketAssignment {
  id: string;
  ticket_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  unassigned_at: string | null;
  reason: string | null;
  metadata: Record<string, any>;
}

// Request/Response types
export interface CreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string | null;
  resolution?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateMessageRequest {
  ticket_id: string;
  message: string;
  is_internal?: boolean;
  attachments?: MessageAttachment[];
  message_type?: MessageType;
  metadata?: Record<string, any>;
}

export interface CreateKnowledgeBaseArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  slug?: string;
  is_published?: boolean;
  is_featured?: boolean;
  search_keywords?: string[];
  meta_description?: string;
}

export interface UpdateKnowledgeBaseArticleRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  slug?: string;
  is_published?: boolean;
  is_featured?: boolean;
  search_keywords?: string[];
  meta_description?: string;
}

export interface SubmitFeedbackRequest {
  article_id: string;
  feedback_type: FeedbackType;
  feedback_text?: string;
}

// Filter and search types
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assigned_to?: string[];
  created_after?: string;
  created_before?: string;
  search?: string;
  tags?: string[];
}

export interface KnowledgeBaseFilters {
  category?: string[];
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  search?: string;
}

// Dashboard and analytics types
export interface SupportDashboardData {
  tickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved_today: number;
    avg_resolution_time: string;
    first_response_time: string;
  };
  knowledge_base: {
    total_articles: number;
    published_articles: number;
    total_views: number;
    avg_helpfulness: number;
  };
  team: {
    active_agents: number;
    online_agents: number;
    avg_workload: number;
  };
  satisfaction: {
    score: number;
    responses: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface TicketTrends {
  daily_volume: Array<{
    date: string;
    count: number;
    resolved: number;
  }>;
  category_distribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  resolution_times: Array<{
    period: string;
    avg_time: number;
  }>;
  satisfaction_scores: Array<{
    period: string;
    score: number;
  }>;
}

// Configuration types
export interface SupportConfiguration {
  auto_assignment: boolean;
  business_hours: {
    timezone: string;
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  escalation_rules: Array<{
    condition: string;
    action: string;
    delay_hours: number;
  }>;
  notification_settings: {
    new_ticket: boolean;
    assignment: boolean;
    status_change: boolean;
    customer_reply: boolean;
    escalation: boolean;
  };
  sla_targets: {
    first_response: number; // hours
    resolution: Record<TicketPriority, number>; // hours by priority
  };
}

// Constants
export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
export const TICKET_CATEGORIES: TicketCategory[] = ['billing', 'technical', 'feature_request', 'bug_report', 'general'];
export const SUPPORT_ROLES: SupportRole[] = ['agent', 'supervisor', 'manager', 'admin'];

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export const KNOWLEDGE_BASE_CATEGORIES = [
  { id: 'getting_started', name: 'Getting Started', icon: 'play-circle' },
  { id: 'features', name: 'Features & Tools', icon: 'settings' },
  { id: 'billing', name: 'Billing & Subscriptions', icon: 'credit-card' },
  { id: 'technical', name: 'Technical Setup', icon: 'code' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: 'help-circle' },
  { id: 'integrations', name: 'Integrations', icon: 'link' },
  { id: 'api', name: 'API Documentation', icon: 'database' },
  { id: 'security', name: 'Security & Privacy', icon: 'shield' }
];