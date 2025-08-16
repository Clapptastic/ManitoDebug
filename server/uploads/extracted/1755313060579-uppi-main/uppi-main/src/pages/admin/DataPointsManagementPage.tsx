import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Database, TrendingUp, Users, Building2, DollarSign, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Helmet } from 'react-helmet-async';
import { getPromptByKey } from '@/services/promptService';
import { DEFAULT_SYSTEM_PROMPTS, PromptVariable } from '@/types/prompts';
import { toast } from '@/hooks/use-toast';

interface DataPoint {
  id: string;
  name: string;
  field_name: string;
  category: string;
  data_type: string;
  is_required: boolean;
  description: string;
  collection_status: 'active' | 'inactive' | 'planned';
  ai_providers: string[];
}

const DATA_POINTS: DataPoint[] = [
  // Company Information
  { id: '1', name: 'Company Name', field_name: 'company_name', category: 'Company Info', data_type: 'string', is_required: true, description: 'Official company name and legal entity', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '2', name: 'Legal Entity', field_name: 'legal_entity', category: 'Company Info', data_type: 'string', is_required: false, description: 'Legal entity structure', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '3', name: 'Year Founded', field_name: 'founded_year', category: 'Company Info', data_type: 'number', is_required: false, description: 'Year the company was established', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '4', name: 'Headquarters Location', field_name: 'headquarters', category: 'Company Info', data_type: 'string', is_required: false, description: 'Primary headquarters location(s)', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '5', name: 'Number of Employees', field_name: 'employee_count', category: 'Company Info', data_type: 'number', is_required: false, description: 'Total number of employees', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '6', name: 'Founders & Executive Bios', field_name: 'founders_bios', category: 'Company Info', data_type: 'array', is_required: false, description: 'Biographies of founders and key executives', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '7', name: 'Mission Statement', field_name: 'mission_statement', category: 'Company Info', data_type: 'string', is_required: false, description: 'Company mission and purpose', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '8', name: 'Vision Statement', field_name: 'vision_statement', category: 'Company Info', data_type: 'string', is_required: false, description: 'Company vision for the future', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '9', name: 'Company Values', field_name: 'company_values', category: 'Company Info', data_type: 'array', is_required: false, description: 'Core company values and culture highlights', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },

  // Financial Information
  { id: '10', name: 'Funding History', field_name: 'funding_history', category: 'Financial', data_type: 'object', is_required: false, description: 'Investment rounds, investors, and amounts', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '11', name: 'Public vs Private Status', field_name: 'public_private_status', category: 'Financial', data_type: 'string', is_required: false, description: 'Company ownership structure', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '12', name: 'Annual Revenue', field_name: 'annual_revenue', category: 'Financial', data_type: 'string', is_required: false, description: 'Annual revenue figures', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '13', name: 'Revenue Growth Rate', field_name: 'revenue_growth_rate', category: 'Financial', data_type: 'string', is_required: false, description: 'Year-over-year revenue growth', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '14', name: 'Profit Margins', field_name: 'profit_margins', category: 'Financial', data_type: 'object', is_required: false, description: 'Gross, operating, and net profit margins', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },
  { id: '15', name: 'EBITDA', field_name: 'ebitda', category: 'Financial', data_type: 'string', is_required: false, description: 'Earnings before interest, taxes, depreciation, and amortization', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },

  // Product Information
  { id: '16', name: 'Main Products/Services', field_name: 'main_products_services', category: 'Products', data_type: 'array', is_required: false, description: 'Primary products and services offered', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '17', name: 'Product Categories', field_name: 'product_categories', category: 'Products', data_type: 'array', is_required: false, description: 'Product segments and categories', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '18', name: 'Unique Selling Proposition', field_name: 'unique_selling_proposition', category: 'Products', data_type: 'string', is_required: false, description: 'Key differentiators and USP', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '19', name: 'Product Roadmap', field_name: 'product_roadmap', category: 'Products', data_type: 'array', is_required: false, description: 'Upcoming product launches and features', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '20', name: 'Technology Stack', field_name: 'technology_stack', category: 'Products', data_type: 'array', is_required: false, description: 'Technologies and platforms used', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },

  // Market Information
  { id: '21', name: 'Target Customer Segments', field_name: 'target_customer_segments', category: 'Market', data_type: 'array', is_required: false, description: 'B2B, B2C, B2G customer segments', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '22', name: 'Market Share Percentage', field_name: 'market_share_percentage', category: 'Market', data_type: 'number', is_required: false, description: 'Estimated market share', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '23', name: 'Geographic Markets', field_name: 'geographic_markets', category: 'Market', data_type: 'array', is_required: false, description: 'Geographic regions served', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '24', name: 'Brand Perception', field_name: 'brand_perception', category: 'Market', data_type: 'string', is_required: false, description: 'Market perception and reputation', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },

  // Pricing & Sales
  { id: '25', name: 'Pricing Strategy', field_name: 'pricing_strategy', category: 'Pricing', data_type: 'object', is_required: false, description: 'Pricing model and strategy (premium, economy, penetration, skimming)', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '26', name: 'Subscription Model', field_name: 'subscription_model', category: 'Pricing', data_type: 'boolean', is_required: false, description: 'Whether company uses subscription pricing', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '27', name: 'Customer Acquisition Cost', field_name: 'customer_acquisition_cost', category: 'Pricing', data_type: 'string', is_required: false, description: 'Cost to acquire new customers (CAC)', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },
  { id: '28', name: 'Customer Lifetime Value', field_name: 'customer_lifetime_value', category: 'Pricing', data_type: 'string', is_required: false, description: 'Average customer lifetime value (CLV)', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },

  // Customer Experience
  { id: '29', name: 'Customer Support Channels', field_name: 'customer_support', category: 'Customer', data_type: 'object', is_required: false, description: 'Support channels and response times', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '30', name: 'Customer Satisfaction Scores', field_name: 'customer_satisfaction', category: 'Customer', data_type: 'object', is_required: false, description: 'CSAT and NPS scores', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },
  { id: '31', name: 'Retention Rate', field_name: 'retention_rate', category: 'Customer', data_type: 'string', is_required: false, description: 'Customer retention percentage', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },
  { id: '32', name: 'Churn Rate', field_name: 'churn_rate', category: 'Customer', data_type: 'string', is_required: false, description: 'Customer churn percentage', collection_status: 'active', ai_providers: ['openai', 'anthropic'] },

  // Technology & Innovation
  { id: '33', name: 'R&D Investment', field_name: 'rd_investment', category: 'Innovation', data_type: 'object', is_required: false, description: 'Research and development investment levels', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '34', name: 'AI Adoption', field_name: 'ai_adoption', category: 'Innovation', data_type: 'string', is_required: false, description: 'AI, automation, and emerging tech adoption', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '35', name: 'Proprietary Technology', field_name: 'proprietary_technology', category: 'Innovation', data_type: 'array', is_required: false, description: 'Patents and proprietary technologies', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },

  // Marketing & Brand
  { id: '36', name: 'Social Media Presence', field_name: 'social_media_presence', category: 'Marketing', data_type: 'object', is_required: false, description: 'Social platforms and engagement levels', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'] },
  { id: '37', name: 'Content Marketing Strategy', field_name: 'content_marketing', category: 'Marketing', data_type: 'object', is_required: false, description: 'Blogs, videos, whitepapers, and content strategy', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '38', name: 'SEO Performance', field_name: 'seo_performance', category: 'Marketing', data_type: 'string', is_required: false, description: 'Search engine optimization rankings', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '39', name: 'Online Reviews', field_name: 'online_reviews', category: 'Marketing', data_type: 'object', is_required: false, description: 'Online review ratings and sentiment', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '40', name: 'Brand Sentiment', field_name: 'brand_sentiment', category: 'Marketing', data_type: 'string', is_required: false, description: 'Overall brand sentiment analysis', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },

  // Operations & Risk
  { id: '41', name: 'Operational Weaknesses', field_name: 'operational_weaknesses', category: 'Risk', data_type: 'array', is_required: false, description: 'Known operational challenges and weaknesses', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '42', name: 'Regulatory Challenges', field_name: 'regulatory_challenges', category: 'Risk', data_type: 'array', is_required: false, description: 'Compliance and regulatory challenges', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] },
  { id: '43', name: 'Market Vulnerabilities', field_name: 'market_vulnerabilities', category: 'Risk', data_type: 'array', is_required: false, description: 'Vulnerability to market shifts or disruption', collection_status: 'active', ai_providers: ['openai', 'anthropic', 'perplexity'] }
];

const CATEGORY_ICONS = {
  'Company Info': Building2,
  'Financial': DollarSign,
  'Products': Settings,
  'Market': TrendingUp,
  'Pricing': DollarSign,
  'Customer': Users,
  'Innovation': Settings,
  'Marketing': TrendingUp,
  'Risk': AlertCircle
};

const DataPointsManagementPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  // Prompt variable names resolved from prompt-get (fallback to defaults)
  const [promptVarNames, setPromptVarNames] = useState<Set<string>>(new Set());

  // On first load, fetch competitor analysis prompt variables and alert on mismatches
  useEffect(() => {
    let isMounted = true;
    async function loadPromptVars() {
      try {
        // Try edge function-managed prompt first
        const key = 'competitor_analysis_expert';
        const res = await getPromptByKey(key);

        // Prefer parsing output field keys from prompt content JSON spec
        const extractKeysFromContent = (content: string | null | undefined): string[] => {
          if (!content) return [];
          const keys = new Set<string>();
          const keyRegex = /"([a-zA-Z0-9_]+)"\s*:/g;
          let m: RegExpExecArray | null;
          while ((m = keyRegex.exec(content)) !== null) {
            const k = m[1];
            // Skip obvious non-field tokens
            if (['System', 'User'].includes(k)) continue;
            keys.add(k);
          }
          // Alias mapping to align with our DATA_POINTS field names
          if (keys.has('name') && !keys.has('company_name')) {
            keys.add('company_name');
          }
          return Array.from(keys);
        };

        let names: string[] = extractKeysFromContent(res?.content);

        // Fallback: use in-repo default template content
        if (names.length === 0) {
          const tpl = DEFAULT_SYSTEM_PROMPTS.find(p => p.category === 'competitor_analysis');
          names = extractKeysFromContent(tpl?.template as string);
        }

        // Final fallback: use variables array if present (less accurate)
        if (names.length === 0 && res && Array.isArray(res.variables)) {
          names = res.variables
            .map((v: unknown) => {
              if (typeof v === 'string') return v;
              if (v && typeof v === 'object' && 'name' in (v as Record<string, unknown>)) {
                return String((v as { name?: unknown }).name);
              }
              return null;
            })
            .filter((n): n is string => !!n);
        }

        if (!isMounted) return;
        const nameSet = new Set(names);
        setPromptVarNames(nameSet);

        // Show a non-blocking heads-up instead of an error. Admins can update the prompt to include these fields.
        const missing = DATA_POINTS.filter(
          dp => dp.collection_status === 'active' && !nameSet.has(dp.field_name)
        );
        if (missing.length > 0) {
          toast({
            title: 'Missing competitor analysis data points',
            description: `${missing.length} active data points are not referenced in the competitor analysis prompt variables.`,
            variant: isAdmin ? 'destructive' : 'default',
            source: 'admin-data-points'
          });
        }
      } catch (err) {
        // Non-fatal: log and continue without blocking UI
        console.warn('[Admin/DataPoints] Failed to load prompt variables', err);
      }
    }
    loadPromptVars();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to access data points management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = [...new Set(DATA_POINTS.map(dp => dp.category))];
  const filteredDataPoints = DATA_POINTS.filter(dp => {
    const matchesSearch = dp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dp.field_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dp.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || dp.collection_status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'planned': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getDataTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'number': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'array': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'object': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      case 'boolean': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const stats = {
    total: DATA_POINTS.length,
    active: DATA_POINTS.filter(dp => dp.collection_status === 'active').length,
    required: DATA_POINTS.filter(dp => dp.is_required).length,
    categories: categories.length
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Helmet>
        <title>Data Points Management | Admin Panel</title>
        <meta name="description" content="Manage and monitor data points collected by AI providers for competitor analysis." />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Points Management</h1>
          <p className="text-muted-foreground">Monitor and manage data points collected by AI providers</p>
        </div>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{stats.active} Active Data Points</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Data Points</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Collection</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Required Fields</p>
                <p className="text-2xl font-bold text-orange-600">{stats.required}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{stats.categories}</p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search data points..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Points List */}
      <div className="grid gap-4">
        {filteredDataPoints.map((dataPoint) => {
          const CategoryIcon = CATEGORY_ICONS[dataPoint.category as keyof typeof CATEGORY_ICONS] || Settings;
          
          return (
            <Card key={dataPoint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{dataPoint.name}</h3>
                        {dataPoint.is_required && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{dataPoint.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {dataPoint.field_name}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getDataTypeColor(dataPoint.data_type)}`}>
                          {dataPoint.data_type}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(dataPoint.collection_status)}`}>
                          {dataPoint.collection_status}
                        </Badge>
                        {promptVarNames.has(dataPoint.field_name) ? (
                          <Badge variant="success" className="text-xs">Active in prompt</Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Not in prompt</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">AI Providers</p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {dataPoint.ai_providers.map(provider => (
                        <Badge key={provider} variant="secondary" className="text-xs">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDataPoints.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data points found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataPointsManagementPage;