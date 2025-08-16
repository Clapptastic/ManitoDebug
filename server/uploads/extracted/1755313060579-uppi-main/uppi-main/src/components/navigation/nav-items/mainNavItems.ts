
import { Home, Search, Settings, BarChart } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: typeof Home;
  description?: string;
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Main dashboard overview'
  },
  {
    title: 'Competitor Analysis',
    href: '/competitor-analysis',
    icon: BarChart,
    description: 'Analyze your competitors'
  },
  {
    title: 'API Keys',
    href: '/api-keys',
    icon: Search,
    description: 'Manage your API keys'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Application settings'
  }
];

export const getMainNavItems = () => mainNavItems;
