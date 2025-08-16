import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Star, Award, Info } from 'lucide-react';

interface EnhancedCompetitorCardProps {
  competitor: any;
  index: number;
  isComparisonMode?: boolean;
  onSelect?: (competitor: any) => void;
  isSelected?: boolean;
  citations?: any[];
  confidenceScores?: any;
}

export const EnhancedCompetitorCard: React.FC<EnhancedCompetitorCardProps> = ({ 
  competitor, 
  index, 
  isComparisonMode = false,
  onSelect,
  isSelected = false,
  citations = [],
  confidenceScores
}) => {
  const getMarketShareTrend = (share: number) => {
    if (share > 20) return { icon: TrendingUp, color: 'text-green-500', trend: 'Growing', bg: 'bg-green-50' };
    if (share < 10) return { icon: TrendingDown, color: 'text-red-500', trend: 'Declining', bg: 'bg-red-50' };
    return { icon: Minus, color: 'text-yellow-500', trend: 'Stable', bg: 'bg-yellow-50' };
  };

  const formatUrl = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const getCompetitiveRating = (score: number) => {
    if (score >= 8) return { label: 'Leader', color: 'bg-green-500', icon: Award };
    if (score >= 6) return { label: 'Strong', color: 'bg-blue-500', icon: Star };
    if (score >= 4) return { label: 'Moderate', color: 'bg-yellow-500', icon: TrendingUp };
    return { label: 'Weak', color: 'bg-red-500', icon: TrendingDown };
  };

  const TrendIcon = getMarketShareTrend(competitor.market_share || 0).icon;
  const trendColor = getMarketShareTrend(competitor.market_share || 0).color;
  const trendBg = getMarketShareTrend(competitor.market_share || 0).bg;
  const trendLabel = getMarketShareTrend(competitor.market_share || 0).trend;

  const rating = getCompetitiveRating(competitor.competitive_score || 0);
  const RatingIcon = rating.icon;

  // Citations and confidence for this competitor
  const competitorCitations = Array.isArray(citations)
    ? citations.filter((c: any) => c?.competitor_name === competitor.name)
    : [];
  const rawConfidence = typeof (competitor as any).confidence === 'number'
    ? (competitor as any).confidence
    : (confidenceScores?.consistency_score ?? null);
  const confidencePercent = rawConfidence != null
    ? Math.round((rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence))
    : null;

  // Animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const handleCardClick = () => {
    if (isComparisonMode && onSelect) {
      onSelect(competitor);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
      className={`relative ${isComparisonMode ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <Card className={`group transition-all duration-300 border-l-4 overflow-hidden ${
        isSelected ? 'border-l-primary ring-2 ring-primary/20' : 'border-l-primary/20'
      } ${isComparisonMode ? 'hover:border-l-primary' : ''}`}>
        {/* Competitive Rating Badge */}
        {competitor.competitive_score && (
          <motion.div 
            className={`absolute top-4 right-4 ${rating.color} text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
          >
            <RatingIcon className="w-3 h-3" />
            {rating.label}
          </motion.div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between pr-16">
            <motion.div 
              className="flex-1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.1 }}
            >
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <motion.span 
                  className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {index + 1}
                </motion.span>
                <span className="group-hover:text-primary transition-colors duration-200">
                  {competitor.name}
                </span>
              </CardTitle>
              {competitor.website && (
                <motion.a
                  href={formatUrl(competitor.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-1 story-link"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  {competitor.website}
                  <ExternalLink className="w-3 h-3" />
                </motion.a>
              )}
            </motion.div>
            
            {/* Right-side metrics: Market share + badges */}
            <div className="flex flex-col items-end gap-2 mt-2">
              {competitor.market_share && (
                <motion.div 
                  className={`flex items-center gap-2 text-sm ${trendBg} px-3 py-1 rounded-full`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <div>
                    <div className="font-semibold">{competitor.market_share}%</div>
                    <div className={`text-xs ${trendColor}`}>{trendLabel}</div>
                  </div>
                  {/* Per-field sources popover for Market Share */}
                  {competitorCitations.some((c: any) => c?.field === 'market_share') && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="ml-1 text-muted-foreground hover-scale" aria-label="View market share sources">
                          <Info className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <div className="font-semibold">Market Share Sources</div>
                          <div className="text-xs text-muted-foreground">
                            Confidence avg: {
                              Math.round(
                                (competitorCitations
                                  .filter((c: any) => c?.field === 'market_share')
                                  .reduce((acc: number, c: any) => acc + (typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0), 0) /
                                Math.max(competitorCitations.filter((c: any) => c?.field === 'market_share').length, 1)
                                ) || 0
                              )
                            }%
                          </div>
                          <ul className="space-y-2">
                            {competitorCitations
                              .filter((c: any) => c?.field === 'market_share')
                              .slice(0, 5)
                              .map((c: any, i: number) => (
                                <li key={i} className="text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                      {c.source || c.url || 'Source'}
                                    </a>
                                    <Badge variant="outline">
                                      {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                    </Badge>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                {confidencePercent != null && (
                  <Badge variant="outline">Confidence: {confidencePercent}%</Badge>
                )}
                <Badge variant="outline">Sources: {competitorCitations.length}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Key Metrics with Animation */}
          <motion.div 
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            {competitor.funding && (
              <motion.div 
                className="bg-muted/50 p-3 rounded-lg hover-scale"
                whileHover={{ backgroundColor: "rgba(var(--primary), 0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Funding</div>
                  {/* Per-field sources popover for Funding */}
                  {competitorCitations.some((c: any) => c?.field === 'funding') && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover-scale" aria-label="View funding sources">
                          <Info className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <div className="font-semibold">Funding Sources</div>
                          <ul className="space-y-2">
                            {competitorCitations
                              .filter((c: any) => c?.field === 'funding')
                              .slice(0, 5)
                              .map((c: any, i: number) => (
                                <li key={i} className="text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                      {c.source || c.url || 'Source'}
                                    </a>
                                    <Badge variant="outline">
                                      {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                    </Badge>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="font-semibold">{competitor.funding}</div>
              </motion.div>
            )}
            {competitor.employees && (
              <motion.div 
                className="bg-muted/50 p-3 rounded-lg hover-scale"
                whileHover={{ backgroundColor: "rgba(var(--primary), 0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Employees</div>
                  {/* Per-field sources popover for Employees */}
                  {competitorCitations.some((c: any) => c?.field === 'employee_count') && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover-scale" aria-label="View employee count sources">
                          <Info className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <div className="font-semibold">Employees Sources</div>
                          <div className="text-xs text-muted-foreground">
                            Confidence avg: {
                              Math.round(
                                (competitorCitations
                                  .filter((c: any) => c?.field === 'employee_count')
                                  .reduce((acc: number, c: any) => acc + (typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0), 0) /
                                Math.max(competitorCitations.filter((c: any) => c?.field === 'employee_count').length, 1)
                                ) || 0
                              )
                            }%
                          </div>
                          <ul className="space-y-2">
                            {competitorCitations
                              .filter((c: any) => c?.field === 'employee_count')
                              .slice(0, 5)
                              .map((c: any, i: number) => (
                                <li key={i} className="text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                      {c.source || c.url || 'Source'}
                                    </a>
                                    <Badge variant="outline">
                                      {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                    </Badge>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="font-semibold">{competitor.employees}</div>
              </motion.div>
            )}
          </motion.div>

          {/* Description with Fade Animation */}
          {competitor.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: index * 0.1 + 0.4 }}
            >
              <p className="text-sm text-muted-foreground line-clamp-3 hover:line-clamp-none transition-all duration-300">
                {competitor.description}
              </p>
            </motion.div>
          )}

          {/* Strengths with Staggered Animation */}
          {competitor.strengths && competitor.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-700">Key Strengths</h4>
                {competitorCitations.some((c: any) => c?.field === 'strengths') && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover-scale" aria-label="View strengths sources">
                        <Info className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <div className="font-semibold">Strengths Sources</div>
                        <ul className="space-y-2">
                          {competitorCitations
                            .filter((c: any) => c?.field === 'strengths')
                            .slice(0, 5)
                            .map((c: any, i: number) => (
                              <li key={i} className="text-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                    {c.source || c.url || 'Source'}
                                  </a>
                                  <Badge variant="outline">
                                    {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                  </Badge>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {competitor.strengths.slice(0, 3).map((strength: string, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.1 + 0.6 + idx * 0.05,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                      {strength}
                    </Badge>
                  </motion.div>
                ))}
                {competitor.strengths.length > 3 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.8 }}
                  >
                    <Badge variant="outline" className="text-xs hover:bg-muted transition-colors">
                      +{competitor.strengths.length - 3} more
                    </Badge>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Additional Insights (Weaknesses, Opportunities, Threats) */}
          {(competitor.weaknesses?.length || competitor.opportunities?.length || competitor.threats?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Weaknesses */}
              {Array.isArray(competitor.weaknesses) && competitor.weaknesses.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground/80">Weaknesses</h4>
                    {competitorCitations.some((c: any) => c?.field === 'weaknesses') && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-muted-foreground hover-scale" aria-label="View weaknesses sources">
                            <Info className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <div className="font-semibold">Weaknesses Sources</div>
                            <ul className="space-y-2">
                              {competitorCitations
                                .filter((c: any) => c?.field === 'weaknesses')
                                .slice(0, 5)
                                .map((c: any, i: number) => (
                                  <li key={i} className="text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                      <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                        {c.source || c.url || 'Source'}
                                      </a>
                                      <Badge variant="outline">
                                        {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                      </Badge>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {competitor.weaknesses.slice(0, 3).map((w: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {w}
                      </Badge>
                    ))}
                    {competitor.weaknesses.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{competitor.weaknesses.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {Array.isArray(competitor.opportunities) && competitor.opportunities.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground/80">Opportunities</h4>
                    {competitorCitations.some((c: any) => c?.field === 'opportunities') && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-muted-foreground hover-scale" aria-label="View opportunities sources">
                            <Info className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <div className="font-semibold">Opportunities Sources</div>
                            <ul className="space-y-2">
                              {competitorCitations
                                .filter((c: any) => c?.field === 'opportunities')
                                .slice(0, 5)
                                .map((c: any, i: number) => (
                                  <li key={i} className="text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                      <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                        {c.source || c.url || 'Source'}
                                      </a>
                                      <Badge variant="outline">
                                        {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                      </Badge>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {competitor.opportunities.slice(0, 3).map((o: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {o}
                      </Badge>
                    ))}
                    {competitor.opportunities.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{competitor.opportunities.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Threats */}
              {Array.isArray(competitor.threats) && competitor.threats.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground/80">Threats</h4>
                    {competitorCitations.some((c: any) => c?.field === 'threats') && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-muted-foreground hover-scale" aria-label="View threats sources">
                            <Info className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <div className="font-semibold">Threats Sources</div>
                            <ul className="space-y-2">
                              {competitorCitations
                                .filter((c: any) => c?.field === 'threats')
                                .slice(0, 5)
                                .map((c: any, i: number) => (
                                  <li key={i} className="text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                      <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                        {c.source || c.url || 'Source'}
                                      </a>
                                      <Badge variant="outline">
                                        {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                      </Badge>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {competitor.threats.slice(0, 3).map((t: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                    {competitor.threats.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{competitor.threats.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Competitive Score with Progress Animation */}
          {competitor.competitive_score && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.7 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  Competitive Strength
                  {(competitorCitations.some((c: any) => c?.field === 'competitive_score') || competitorCitations.some((c: any) => c?.field === 'threat_level')) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover-scale" aria-label="View competitive score sources">
                          <Info className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <div className="font-semibold">Competitive Score Sources</div>
                          <ul className="space-y-2">
                            {competitorCitations
                              .filter((c: any) => ['competitive_score','threat_level'].includes(c?.field))
                              .slice(0, 5)
                              .map((c: any, i: number) => (
                                <li key={i} className="text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <a href={c.url || '#'} target="_blank" rel="noreferrer" className="story-link text-primary text-xs truncate">
                                      {c.source || c.url || 'Source'}
                                    </a>
                                    <Badge variant="outline">
                                      {Math.round(typeof c.confidence === 'number' ? (c.confidence <= 1 ? c.confidence * 100 : c.confidence) : 0)}%
                                    </Badge>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </span>
                <motion.span 
                  className="text-sm font-semibold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.8, type: "spring" }}
                >
                  {competitor.competitive_score}/10
                </motion.span>
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.9, duration: 0.8, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
              >
                <Progress 
                  value={competitor.competitive_score * 10} 
                  className="h-2"
                />
              </motion.div>
            </motion.div>
          )}

          {/* Comparison Mode Selection */}
          {isComparisonMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 1.0 }}
            >
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) onSelect(competitor);
                }}
              >
                {isSelected ? 'Selected' : 'Select for Comparison'}
              </Button>
            </motion.div>
          )}
        </CardContent>

        {/* Hover Overlay Effect */}
        <motion.div
          className="absolute inset-0 bg-primary/5 opacity-0 pointer-events-none"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </Card>
    </motion.div>
  );
};