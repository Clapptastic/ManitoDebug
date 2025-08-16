/**
 * Knowledge Base Section Component
 * Displays knowledge base articles and search
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Eye,
  Star,
  Filter
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import type { 
  KnowledgeBaseArticle, 
  KnowledgeBaseFilters 
} from '@/types/support';
import { KNOWLEDGE_BASE_CATEGORIES } from '@/types/support';
import { supportService } from '@/services/supportService';
import { toast } from 'sonner';

interface KnowledgeBaseSectionProps {
  onArticleClick?: (article: KnowledgeBaseArticle) => void;
}

export const KnowledgeBaseSection: React.FC<KnowledgeBaseSectionProps> = ({
  onArticleClick
}) => {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [filters, setFilters] = useState<KnowledgeBaseFilters>({
    is_published: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [filters]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const result = await supportService.getKnowledgeBaseArticles(filters);
      setArticles(result);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof KnowledgeBaseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArticleFeedback = async (articleId: string, feedbackType: 'helpful' | 'not_helpful') => {
    try {
      await supportService.submitKnowledgeBaseFeedback(articleId, feedbackType);
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? {
              ...article,
              [feedbackType === 'helpful' ? 'helpful_count' : 'not_helpful_count']: 
                article[feedbackType === 'helpful' ? 'helpful_count' : 'not_helpful_count'] + 1
            }
          : article
      ));
      
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const clearFilters = () => {
    setFilters({ is_published: true });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Find answers to common questions and learn about our features
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid gap-4 sm:grid-cols-2">
              <Select
                value={filters.category?.[0] || ''}
                onValueChange={(value) => 
                  handleFilterChange('category', value ? [value] : [])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {KNOWLEDGE_BASE_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={filters.is_featured ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange('is_featured', !filters.is_featured)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Featured Only
                </Button>
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Articles */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading articles...</div>
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.category?.length || filters.is_featured
                  ? "No articles match your search criteria."
                  : "No articles are currently available."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card 
              key={article.id} 
              className={`hover:shadow-md transition-shadow ${onArticleClick ? 'cursor-pointer' : ''}`}
              onClick={() => onArticleClick?.(article)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      {article.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {article.excerpt && (
                      <CardDescription className="text-sm">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">
                    {KNOWLEDGE_BASE_CATEGORIES.find(cat => cat.id === article.category)?.name || article.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{article.view_count} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{article.helpful_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsDown className="h-4 w-4" />
                      <span>{article.not_helpful_count}</span>
                    </div>
                    <span>Updated {formatDate(article.updated_at)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArticleFeedback(article.id, 'helpful');
                      }}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArticleFeedback(article.id, 'not_helpful');
                      }}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mt-3">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{article.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};