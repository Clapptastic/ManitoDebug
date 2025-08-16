import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  User, 
  Crown, 
  TrendingUp,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface PersonnelAnalysisSectionProps {
  analysis: CompetitorAnalysis;
}

export const PersonnelAnalysisSection: React.FC<PersonnelAnalysisSectionProps> = ({ analysis }) => {
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  return (
    <div className="space-y-8">
      {/* Personnel Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Team Size"
          value={analysis.employee_count ? analysis.employee_count.toLocaleString() : 'N/A'}
          subtitle="Total employees"
          icon={Users}
          confidence={analysis.confidence_scores?.employee_count}
        />
        
        <MetricCard
          title="Key Personnel"
          value={analysis.key_personnel ? Object.keys(analysis.key_personnel).length : 0}
          subtitle="Leadership team"
          icon={Crown}
        />
        
        <MetricCard
          title="Employee Verified"
          value={primaryResult.employee_count_verified ? 'Yes' : 'No'}
          subtitle="Data accuracy"
          icon={TrendingUp}
        />
        
        <MetricCard
          title="Growth Rate"
          value={analysis.key_personnel?.growth_rate || 'N/A'}
          subtitle="Team expansion"
          icon={TrendingUp}
        />
      </div>

      {/* Key Personnel */}
      {analysis.key_personnel && Object.keys(analysis.key_personnel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Key Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeof analysis.key_personnel === 'object' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysis.key_personnel).map(([position, person]) => {
                    if (typeof person === 'string') {
                      return (
                        <div key={position} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{person}</h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {position.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const personData = person as any;
                    return (
                      <div key={position} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{personData.name || 'Unknown'}</h4>
                            <p className="text-sm text-muted-foreground mb-3 capitalize">
                              {position.replace(/_/g, ' ')}
                            </p>
                            
                            <div className="space-y-2">
                              {personData.background && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <GraduationCap className="h-3 w-3" />
                                  <span>{personData.background}</span>
                                </div>
                              )}
                              
                              {personData.experience && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{personData.experience}</span>
                                </div>
                              )}
                              
                              {personData.tenure && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{personData.tenure}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Composition */}
      {analysis.key_personnel?.departments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(analysis.key_personnel.departments).map(([dept, count]) => (
                <div key={dept} className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{String(count)}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {dept.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location & Culture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {analysis.headquarters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location & Presence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Headquarters</p>
                    <p className="text-sm text-muted-foreground">{analysis.headquarters}</p>
                  </div>
                </div>
                
                {analysis.geographic_presence && analysis.geographic_presence.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Geographic Presence
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.geographic_presence.slice(0, 6).map((location, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {location}
                        </Badge>
                      ))}
                      {analysis.geographic_presence.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{analysis.geographic_presence.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.key_personnel?.culture && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Company Culture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {typeof analysis.key_personnel.culture === 'string' 
                    ? analysis.key_personnel.culture 
                    : 'No company culture information available'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Personnel Analysis Summary */}
      {primaryResult.personnel_analysis && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Personnel Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {typeof primaryResult.personnel_analysis === 'string' 
                  ? primaryResult.personnel_analysis 
                  : primaryResult.personnel_analysis?.summary || 'No personnel analysis summary available'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};