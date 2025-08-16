import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MarketAnalysisSession {
  id: string;
  user_id: string;
  session_type: string;
  query_text: string;
  company_name?: string;
  ticker_symbol?: string;
  market_segment?: string;
  time_range?: string;
  validation_status?: string;
  data_quality_score?: number;
  confidence_scores?: any;
  sentiment_score?: number;
  created_at: string;
  updated_at: string;
}

const SavedMarketAnalysesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analyses, setAnalyses] = useState<MarketAnalysisSession[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<MarketAnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, searchTerm, filterType, filterStatus]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('market_analysis_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved analyses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnalyses = () => {
    let filtered = analyses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis => 
        (analysis.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (analysis.ticker_symbol?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (analysis.market_segment?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (analysis.query_text?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(analysis => analysis.session_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(analysis => analysis.validation_status === filterStatus);
    }

    setFilteredAnalyses(filtered);
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('market_analysis_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAnalyses(prev => prev.filter(analysis => analysis.id !== id));
      toast({
        title: 'Success',
        description: 'Analysis deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete analysis',
        variant: 'destructive',
      });
    }
  };

  const handleExportAnalysis = (analysis: MarketAnalysisSession) => {
    const exportData = {
      id: analysis.id,
      company_name: analysis.company_name,
      ticker_symbol: analysis.ticker_symbol,
      query: analysis.query_text,
      type: analysis.session_type,
      status: analysis.validation_status,
      quality_score: analysis.data_quality_score,
      created_at: analysis.created_at
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${analysis.company_name || analysis.ticker_symbol || analysis.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company_analysis': return <Activity className="h-4 w-4" />;
      case 'market_segment': return <BarChart3 className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your saved market analyses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Market Analyses</h1>
          <p className="text-muted-foreground">
            View and manage your market research analyses
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigate('/market-research')}>
            <Plus className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
          <Button variant="outline" onClick={fetchAnalyses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search analyses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="company_analysis">Company Analysis</SelectItem>
                <SelectItem value="market_segment">Market Segment</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analysis List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Analyses ({filteredAnalyses.length})</span>
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-lg text-muted-foreground">Loading analyses...</span>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No analyses found</h3>
              <p className="text-muted-foreground mb-4">
                {analyses.length === 0 
                  ? "You haven't created any market analyses yet"
                  : "No analyses match your current filters"
                }
              </p>
              <Button onClick={() => navigate('/market-research')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <div 
                  key={analysis.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(analysis.session_type)}
                        <h3 className="font-medium">
                          {analysis.company_name || analysis.ticker_symbol || analysis.market_segment || 'Market Analysis'}
                        </h3>
                        <Badge className={getStatusColor(analysis.validation_status)}>
                          {analysis.validation_status || 'Unknown'}
                        </Badge>
                        {analysis.data_quality_score && (
                          <Badge variant="outline">
                            Quality: {Math.round(analysis.data_quality_score)}%
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {analysis.query_text}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Filter className="h-3 w-3" />
                          <span>{analysis.session_type === 'company_analysis' ? 'Company' : 'Market Segment'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/market-analysis/${analysis.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportAnalysis(analysis)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedMarketAnalysesPage;