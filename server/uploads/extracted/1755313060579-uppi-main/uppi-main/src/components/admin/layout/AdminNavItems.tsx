import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Activity,
  BarChart3,
  Link2,
  Database,
  Package,
  RefreshCcw,
  Code2,
  Shield,
  Terminal,
  BookOpen,
  KeyRound,
  Crown,
  FileCode2,
  BookText,
  Cpu,
  Layers,
  GitBranch,
  Zap,
  ListChecks,
  FileSearch,
  Flag
} from 'lucide-react';
import { UserRole } from '@/types/auth/roles';

/**
 * Interface for AdminNavItem with enhanced properties
 */
export interface AdminNavItem {
  title: string;
  href: string;
  path: string;
  icon: React.ElementType;
  disabled?: boolean;
  external?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  requiredRole?: UserRole;
  description?: string;
  category?: string;
}

/**
 * Enhanced admin navigation items with better organization and modern icons
 */
export const adminItems: AdminNavItem[] = [
  // Overview Section
  {
    title: 'Dashboard',
    href: '/admin',
    path: '',
    icon: LayoutDashboard,
    description: 'Main admin overview and metrics',
    category: 'overview'
  },
  {
    title: 'System Health',
    href: '/admin/system-health',
    path: 'system-health',
    icon: Activity,
    description: 'Monitor system performance and health',
    category: 'overview'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    path: 'analytics',
    icon: BarChart3,
    description: 'Platform analytics and insights',
    category: 'overview'
  },

  // Core Management Section
  {
    title: 'User Management',
    href: '/admin/user-management',
    path: 'user-management',
    icon: Users,
    description: 'Manage users, roles, and permissions',
    category: 'management'
  },
  {
    title: 'API Management',
    href: '/admin/api-management',
    path: 'api-management',
    icon: KeyRound,
    description: 'Manage API keys and integrations',
    category: 'management'
  },
  {
    title: 'Affiliate Program',
    href: '/admin/affiliate',
    path: 'affiliate',
    icon: Link2,
    description: 'Manage affiliate links and tracking',
    category: 'management'
  },

  // Development Tools Section
  {
    title: 'Development Tools',
    href: '/admin/dev-tools',
    path: 'dev-tools',
    icon: Terminal,
    description: 'Developer utilities and tools',
    category: 'development'
  },
  {
    title: 'System Testing',
    href: '/admin/system-testing',
    path: 'system-testing',
    icon: Terminal,
    description: 'Run system tests and diagnostics',
    category: 'development'
  },
  {
    title: 'Code Wiki',
    href: '/admin/codewiki',
    path: 'codewiki',
    icon: FileCode2,
    badge: 'New',
    badgeVariant: 'secondary',
    description: 'Code documentation and wiki',
    category: 'development'
  },
  {
    title: 'Knowledge Base',
    href: '/admin/wiki',
    path: 'wiki',
    icon: BookText,
    description: 'Manage documentation and guides',
    category: 'development'
  },
  {
    title: 'Code Embeddings',
    href: '/admin/code-embeddings',
    path: 'code-embeddings',
    icon: Code2,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'AI code analysis and embeddings',
    category: 'development'
  },
  {
    title: 'Package Updates',
    href: '/admin/package-updates',
    path: 'package-updates',
    icon: Package,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Update open-source dependencies and review security',
    category: 'development'
  },

  // System Administration Section
  {
    title: 'Database Optimizer',
    href: '/admin/database-optimizer',
    path: 'database-optimizer',
    icon: Database,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Database optimization and performance tuning',
    category: 'system'
  },
  {
    title: 'Security Audit',
    href: '/admin/security-audit',
    path: 'security-audit',
    icon: Shield,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Security audit and compliance monitoring',
    category: 'system'
  },
  {
    title: 'Vault Audit',
    href: '/admin/vault-audit',
    path: 'vault-audit',
    icon: Shield,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Comprehensive Supabase vault and API key audit',
    category: 'system'
  },
  {
    title: 'Legal Compliance',
    href: '/admin/legal-compliance',
    path: 'legal-compliance',
    icon: Shield,
    description: 'Legal and compliance center',
    category: 'system'
  },
  {
    title: 'Schema Viewer',
    href: '/admin/schema-viewer',
    path: 'schema-viewer',
    icon: Layers,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Database schema visualization',
    category: 'system'
  },
  {
    title: 'Database Explorer',
    href: '/admin/database',
    path: 'database',
    icon: Database,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Database management and operations',
    category: 'system'
  },
  {
    title: 'Microservices',
    href: '/admin/microservices',
    path: 'microservices',
    icon: Cpu,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Monitor microservices architecture',
    category: 'system'
  },
  // Data Points Management - manage tracked metrics and definitions (visible in System section)
  {
    title: 'Data Points',
    href: '/admin/data-points-management',
    path: 'data-points-management',
    icon: ListChecks,
    description: 'Manage tracked data points and definitions',
    category: 'system'
  },
  {
    title: 'Feature Flags',
    href: '/admin/feature-flags',
    path: 'feature-flags',
    icon: Flag,
    description: 'Manage feature toggles and scopes',
    category: 'system'
  },
  {
    title: 'Type Coverage',
    href: '/admin/type-coverage',
    path: 'type-coverage',
    icon: Shield,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'TypeScript coverage analysis',
    category: 'system'
  },

// Advanced Section
  {
    title: 'Super Admin',
    href: '/admin/super-admin',
    path: 'super-admin',
    icon: Crown,
    requiredRole: UserRole.SUPER_ADMIN,
    badge: 'Admin',
    badgeVariant: 'destructive',
    description: 'Super admin controls and settings',
    category: 'advanced'
  },
  {
    title: 'Master Profiles',
    href: '/admin/master-profiles',
    path: 'master-profiles',
    icon: GitBranch,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Master profile management',
    category: 'advanced'
  },
  {
    title: 'Analysis Flow Monitor',
    href: '/admin/analysis-flow',
    path: 'analysis-flow',
    icon: Activity,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Monitor analysis pipeline and statuses',
    category: 'advanced'
  },
  {
    title: 'Permissions',
    href: '/admin/permissions',
    path: 'permissions',
    icon: Zap,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Advanced permission management',
    category: 'advanced'
  },

  // Superadmin Prompts
  {
    title: 'Prompts',
    href: '/admin/prompts',
    path: 'prompts',
    icon: BookOpen,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Manage AI prompts (Single Source of Truth)',
    category: 'advanced'
  },

  {
    title: 'Flow Management',
    href: '/admin/flows',
    path: 'flows',
    icon: GitBranch,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Manage application flows and processes',
    category: 'advanced'
  },
  {
    title: 'System Optimization',
    href: '/admin/system-optimization',
    path: 'system-optimization',
    icon: Zap,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'System performance optimization tools',
    category: 'system'
  },
  {
    title: 'Edge Function Debugger',
    href: '/admin/debug-functions',
    path: 'debug-functions',
    icon: Terminal,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Debug and test edge functions',
    category: 'development'
  },

  // System Coverage & Audits
  {
    title: 'Nav Coverage Audit',
    href: '/admin/nav-coverage',
    path: 'nav-coverage',
    icon: ListChecks,
    requiredRole: UserRole.SUPER_ADMIN,
    description: 'Find admin routes not present in navigation',
    category: 'system'
  },
  {
    title: 'Unused Components',
    href: '/admin/unused-components',
    path: 'unused-components',
    icon: FileSearch,
    requiredRole: UserRole.ADMIN,
    description: 'List components that appear unused',
    category: 'system'
  },

  // Settings Section
  {
    title: 'Settings',
    href: '/admin/settings',
    path: 'settings',
    icon: Settings,
    description: 'Admin panel configuration',
    category: 'settings'
  },
];

/**
 * Function to get admin items - kept for backward compatibility
 */
export function getAdminNavItems(): AdminNavItem[] {
  return adminItems;
}

/**
 * Get items by category
 */
export function getAdminItemsByCategory(category: string): AdminNavItem[] {
  return adminItems.filter(item => item.category === category);
}

/**
 * Get all available categories
 */
export function getAdminCategories(): string[] {
  const categories = new Set(adminItems.map(item => item.category).filter(Boolean));
  return Array.from(categories);
}