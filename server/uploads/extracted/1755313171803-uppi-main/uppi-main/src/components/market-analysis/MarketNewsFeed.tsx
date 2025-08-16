import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  id: string;
  headline: string;
  summary?: string;
  url: string;
  source: string;
  published_at: string;
  sentiment_score?: number;
  sentiment_label?: string;
  relevance_score?: number;
  tags?: string[];
}

interface MarketNewsFeedProps {
  ticker?: string;
  newsCount?: number;
}

const MarketNewsFeed: React.FC<MarketNewsFeedProps> = ({ ticker, newsCount = 0 }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  useEffect(() => {
    fetchNews();
  }, [ticker]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('market_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);

      if (ticker) {
        query = query.eq('ticker_symbol', ticker.toUpperCase());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching news:', error);
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (score?: number) => {
    if (!score) return Minus;
    if (score > 0.1) return TrendingUp;
    if (score < -0.1) return TrendingDown;
    return Minus;
  };

  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score > 0.1) return 'text-emerald-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-amber-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = selectedSource === 'all' || 
      article.source.toLowerCase().includes(selectedSource.toLowerCase());

    return matchesSearch && matchesSource;
  });

  const sources = [...new Set(articles.map(article => article.source))];

  return (
    <div className="space-y-6">
      {/* News Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Market News
              {ticker && <span className="text-sm font-normal">for {ticker}</span>}
            </div>
            <Badge variant="outline">
              {filteredArticles.length} articles
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedSource === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSource('all')}
              >
                All Sources
              </Button>
              {sources.slice(0, 3).map((source) => (
                <Button
                  key={source}
                  variant={selectedSource === source ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSource(source)}
                  className="hidden sm:inline-flex"
                >
                  {source}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Articles */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading news articles...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No news articles found</p>
              {ticker ? (
                <p className="text-sm">No recent news for {ticker}</p>
              ) : (
                <p className="text-sm">Try searching for a specific company or keyword</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const SentimentIcon = getSentimentIcon(article.sentiment_score);
            return (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg leading-tight">
                          {article.headline}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {article.sentiment_score !== undefined && (
                            <div className={`flex items-center gap-1 ${getSentimentColor(article.sentiment_score)}`}>
                              <SentimentIcon className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                {article.sentiment_score.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {article.summary && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {article.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(article.published_at)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {article.source}
                          </Badge>
                          {article.sentiment_label && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSentimentColor(article.sentiment_score)}`}
                            >
                              {article.sentiment_label}
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(article.url, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Read More
                        </Button>
                      </div>
                      
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {filteredArticles.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" onClick={fetchNews} disabled={loading}>
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarketNewsFeed;