import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Grid, 
  List,
  Download,
  Share2,
  GitCompare as Compare,
  X
} from 'lucide-react';
import { EnhancedCompetitorCard } from './EnhancedCompetitorCard';

interface CompetitorListViewProps {
  competitors: any[];
  citations?: any[];
  confidenceScores?: any;
  onExport?: () => void;
  onShare?: () => void;
}

export const CompetitorListView: React.FC<CompetitorListViewProps> = ({
  competitors,
  citations,
  confidenceScores,
  onExport,
  onShare
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'market_share' | 'competitive_score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedCompetitors, setSelectedCompetitors] = useState<any[]>([]);
  const [filterStrength, setFilterStrength] = useState<'all' | 'strong' | 'moderate' | 'weak'>('all');

  // Filter and sort competitors
  const filteredAndSortedCompetitors = competitors
    .filter(competitor => {
      const matchesSearch = competitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (competitor.description && competitor.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStrength = filterStrength === 'all' || (() => {
        const score = competitor.competitive_score || 0;
        switch (filterStrength) {
          case 'strong': return score >= 7;
          case 'moderate': return score >= 4 && score < 7;
          case 'weak': return score < 4;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesStrength;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'market_share':
          aValue = a.market_share || 0;
          bValue = b.market_share || 0;
          break;
        case 'competitive_score':
          aValue = a.competitive_score || 0;
          bValue = b.competitive_score || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
          break;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCompetitorSelect = (competitor: any) => {
    setSelectedCompetitors(prev => {
      const isSelected = prev.some(c => c.name === competitor.name);
      if (isSelected) {
        return prev.filter(c => c.name !== competitor.name);
      } else if (prev.length < 3) {
        return [...prev, competitor];
      }
      return prev;
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Filter className="w-5 h-5 text-primary" />
                  </motion.div>
                  Competitor Analysis ({filteredAndSortedCompetitors.length})
                </CardTitle>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsComparisonMode(!isComparisonMode)}
                  className={isComparisonMode ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Compare className="w-4 h-4 mr-2" />
                  Compare Mode
                </Button>
                
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search competitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {/* Strength Filter */}
                <select
                  value={filterStrength}
                  onChange={(e) => setFilterStrength(e.target.value as any)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Strengths</option>
                  <option value="strong">Strong (7+)</option>
                  <option value="moderate">Moderate (4-7)</option>
                  <option value="weak">Weak (&lt;4)</option>
                </select>
                
                {/* Sort Controls */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  className={sortBy === 'name' ? 'bg-muted' : ''}
                >
                  Name
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('market_share')}
                  className={sortBy === 'market_share' ? 'bg-muted' : ''}
                >
                  Market Share
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('competitive_score')}
                  className={sortBy === 'competitive_score' ? 'bg-muted' : ''}
                >
                  Score
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                
                {/* View Mode Toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Comparison Mode Header */}
      <AnimatePresence>
        {isComparisonMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Comparison Mode Active</h3>
                    <p className="text-sm text-muted-foreground">
                      Select up to 3 competitors to compare ({selectedCompetitors.length}/3)
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedCompetitors.length > 0 && (
                      <Button size="sm">
                        Compare Selected ({selectedCompetitors.length})
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsComparisonMode(false);
                        setSelectedCompetitors([]);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {selectedCompetitors.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {selectedCompetitors.map((competitor, index) => (
                      <motion.div
                        key={competitor.name}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        layout
                      >
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {competitor.name}
                          <button
                            onClick={() => handleCompetitorSelect(competitor)}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competitors Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${searchTerm}-${sortBy}-${sortOrder}-${filterStrength}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={viewMode === 'grid' 
            ? 'grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' 
            : 'space-y-4'
          }
        >
          {filteredAndSortedCompetitors.map((competitor, index) => (
            <EnhancedCompetitorCard
              key={competitor.name}
              competitor={competitor}
              index={index}
              isComparisonMode={isComparisonMode}
              onSelect={handleCompetitorSelect}
              isSelected={selectedCompetitors.some(c => c.name === competitor.name)}
              citations={citations}
              confidenceScores={confidenceScores}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredAndSortedCompetitors.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No competitors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStrength('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};