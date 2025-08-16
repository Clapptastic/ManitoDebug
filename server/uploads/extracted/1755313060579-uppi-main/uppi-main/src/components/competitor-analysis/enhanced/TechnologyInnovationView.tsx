import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cpu, 
  Lightbulb, 
  Award, 
  DollarSign,
  Users,
  GitBranch,
  Database,
  Cloud,
  Smartphone,
  Brain,
  Lock,
  Beaker
} from 'lucide-react';
import { CompetitorAnalysisEntity } from '@/types/competitor';

interface TechnologyInnovationViewProps {
  analysis: CompetitorAnalysisEntity;
}

export const TechnologyInnovationView: React.FC<TechnologyInnovationViewProps> = ({ analysis }) => {
  const techData = (analysis as any).technology_innovation_data 
    || (analysis as any).analysis_data?.technology_innovation 
    || (analysis as any).analysis_data?.results?.[0]?.technology_innovation 
    || (analysis as any).technology_analysis
    || (analysis as any).analysis_data?.technology_analysis
    || (analysis as any).analysis_data?.results?.[0]?.technology_analysis
    || {};

  const getTechIcon = (tech: string) => {
    const lowerTech = tech.toLowerCase();
    if (lowerTech.includes('database') || lowerTech.includes('sql')) return <Database className="w-4 h-4" />;
    if (lowerTech.includes('cloud') || lowerTech.includes('aws') || lowerTech.includes('azure')) return <Cloud className="w-4 h-4" />;
    if (lowerTech.includes('mobile') || lowerTech.includes('ios') || lowerTech.includes('android')) return <Smartphone className="w-4 h-4" />;
    if (lowerTech.includes('ai') || lowerTech.includes('ml') || lowerTech.includes('machine learning')) return <Brain className="w-4 h-4" />;
    if (lowerTech.includes('security') || lowerTech.includes('auth')) return <Lock className="w-4 h-4" />;
    return <Cpu className="w-4 h-4" />;
  };

  const renderInnovationScore = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Innovation Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        {techData.innovation_score !== undefined ? (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{techData.innovation_score}/10</div>
              <div className="text-sm text-muted-foreground">Innovation Rating</div>
            </div>
            <Progress value={techData.innovation_score * 10} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Innovation score not available</div>
        )}
      </CardContent>
    </Card>
  );

  const renderTechnologyStack = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          Technology Stack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {techData.technology_stack && Object.entries(techData.technology_stack).map(([category, technologies]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold mb-2 capitalize">{category.replace('_', ' ')}</h4>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(technologies) && technologies.length > 0 ? technologies.map((tech: string, idx: number) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1">
                  {getTechIcon(tech)}
                  {tech}
                </Badge>
              )) : (
                <span className="text-xs text-muted-foreground">No data available</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderPatentsIP = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" />
          Patents & IP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {techData.patents_ip ? (
          <>
            {techData.patents_ip.patent_count && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patent Count</span>
                <Badge variant="secondary">{techData.patents_ip.patent_count}</Badge>
              </div>
            )}
            
            {techData.patents_ip.key_innovations && techData.patents_ip.key_innovations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Innovations</h4>
                <div className="space-y-1">
                  {techData.patents_ip.key_innovations.map((innovation: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Beaker className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                      <span className="text-xs">{innovation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {techData.patents_ip.ip_strategy && (
              <div>
                <h4 className="text-sm font-semibold mb-1">IP Strategy</h4>
                <p className="text-xs text-muted-foreground">{techData.patents_ip.ip_strategy}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Patents & IP data not available</div>
        )}
      </CardContent>
    </Card>
  );

  const renderRnDInvestment = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          R&D Investment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {techData.rd_investment ? (
          <>
            {techData.rd_investment.percentage_of_revenue && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{techData.rd_investment.percentage_of_revenue}</div>
                <div className="text-sm text-muted-foreground">of Revenue</div>
              </div>
            )}

            {techData.rd_investment.focus_areas && techData.rd_investment.focus_areas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-1">
                  {techData.rd_investment.focus_areas.map((area: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            )}

            {techData.rd_investment.recent_breakthroughs && techData.rd_investment.recent_breakthroughs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Recent Breakthroughs</h4>
                <div className="space-y-1">
                  {techData.rd_investment.recent_breakthroughs.map((breakthrough: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                      <span className="text-xs">{breakthrough}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">R&D investment data not available</div>
        )}
      </CardContent>
    </Card>
  );

  const renderInnovationCulture = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Innovation Culture
        </CardTitle>
      </CardHeader>
      <CardContent>
        {techData.innovation_culture ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Innovation Labs:</span>
              <Badge variant={techData.innovation_culture.innovation_labs ? "default" : "secondary"}>
                {techData.innovation_culture.innovation_labs ? "Yes" : "No"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Open Source:</span>
              <Badge variant={techData.innovation_culture.open_source ? "default" : "secondary"}>
                {techData.innovation_culture.open_source ? "Active" : "Limited"}
              </Badge>
            </div>

            {techData.innovation_culture.partnerships && techData.innovation_culture.partnerships.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Partnerships:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {techData.innovation_culture.partnerships.map((partner: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">{partner}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Innovation culture data not available</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderInnovationScore()}
        {renderPatentsIP()}
        {renderRnDInvestment()}
        {renderTechnologyStack()}
      </div>
      {renderInnovationCulture()}
    </div>
  );
};