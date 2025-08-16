
import { TrendingUp, FileText, BarChart3, Users, Globe, DollarSign, Target } from 'lucide-react';

export const marketResearchItems = [
  {
    path: '/market-research/competitor-analysis',
    label: 'Competitor Analysis',
    icon: TrendingUp,
    description: 'Research competitors'
  },
  {
    path: '/market-research/saved-analyses',
    label: 'Saved Analyses',
    icon: FileText,
    description: 'View saved analyses'
  },
  {
    path: '/market-research/market-size',
    label: 'Market Size Analysis',
    icon: BarChart3,
    description: 'Analyze TAM, SAM, SOM'
  },
  {
    path: '/market-research/customer-surveys',
    label: 'Customer Surveys',
    icon: Users,
    description: 'Survey your customers'
  },
  {
    path: '/market-research/trend-analysis',
    label: 'Trend Analysis',
    icon: TrendingUp,
    description: 'Identify market trends'
  },
  {
    path: '/market-research/price-testing',
    label: 'Price Testing',
    icon: DollarSign,
    description: 'Optimize your pricing'
  },
  {
    path: '/market-research/geographic-analysis',
    label: 'Geographic Analysis',
    icon: Globe,
    description: 'Regional market data'
  }
];
