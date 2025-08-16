import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Code, 
  Shield, 
  Lightbulb,
  Award,
  Database,
  Cloud,
  Smartphone,
  Globe,
  ExternalLink,
  Box,
  GitBranch,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface TechnologyAnalysisSectionProps {
  analysis: CompetitorAnalysis;
}

export const TechnologyAnalysisSection: React.FC<TechnologyAnalysisSectionProps> = ({ analysis }) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  return (
    <div className="space-y-8">
      {/* Technology Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Innovation Score"
          value={`${Math.round(analysis.innovation_score || 0)}%`}
          subtitle="Technology leadership"
          icon={Lightbulb}
          confidence={analysis.confidence_scores?.innovation_score}
        />
        
        <MetricCard
          title="Patent Count"
          value={analysis.patent_count || 0}
          subtitle="Intellectual property"
          icon={Award}
          confidence={analysis.confidence_scores?.patent_count}
        />
        
        <MetricCard
          title="Tech Stack"
          value={analysis.technology_analysis?.stack_complexity || 'Unknown'}
          subtitle="Architecture complexity"
          icon={Code}
        />
        
        <MetricCard
          title="Security Score"
          value={analysis.technology_analysis?.security_score ? `${analysis.technology_analysis.security_score}%` : 'N/A'}
          subtitle="Security posture"
          icon={Shield}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technology Stack */}
        {analysis.technology_analysis?.stack && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(analysis.technology_analysis.stack) ? (
                  analysis.technology_analysis.stack.map((tech, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{String(tech)}</span>
                      <Badge variant="secondary" className="text-xs">Core</Badge>
                    </div>
                  ))
                ) : (
                  Object.entries(analysis.technology_analysis.stack).map(([category, technologies]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground capitalize">
                        {category.replace(/_/g, ' ')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(technologies) ? (
                          technologies.map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {String(tech)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {String(technologies)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications & Standards */}
        {analysis.certification_standards && analysis.certification_standards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certifications & Standards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.certification_standards.map((cert, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-1 bg-green-100 rounded">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Products & Services */}
      {analysis.technology_analysis?.products && analysis.technology_analysis.products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Products & Services
              <Badge variant="secondary" className="ml-2">{analysis.technology_analysis.products.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(showAllProducts ? analysis.technology_analysis.products : analysis.technology_analysis.products.slice(0, 6)).map((product, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{product.name}</h4>
                      {product.category && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    {product.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(product.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {analysis.technology_analysis.products.length > 6 && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="gap-2"
                >
                  {showAllProducts ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less Products
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All {analysis.technology_analysis.products.length} Products
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Product Portfolio */}
      {analysis.product_portfolio && typeof analysis.product_portfolio === 'object' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Product Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Products */}
            {analysis.product_portfolio.primary_products && analysis.product_portfolio.primary_products.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  Primary Products
                  <Badge variant="secondary" className="text-xs">{analysis.product_portfolio.primary_products.length}</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.product_portfolio.primary_products.map((product: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm">{product.name}</h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.category && (
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            )}
                            {product.pricing && (
                              <Badge variant="secondary" className="text-xs">💰 {product.pricing}</Badge>
                            )}
                            {product.launch_date && (
                              <Badge variant="outline" className="text-xs">📅 {product.launch_date}</Badge>
                            )}
                          </div>
                        </div>
                        {product.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(product.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {analysis.product_portfolio.services && analysis.product_portfolio.services.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  Services
                  <Badge variant="secondary" className="text-xs">{analysis.product_portfolio.services.length}</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.product_portfolio.services.map((service: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between">
                        <h5 className="font-semibold text-sm">{service.name}</h5>
                        {service.pricing && (
                          <Badge variant="outline" className="text-xs">💰 {service.pricing}</Badge>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APIs */}
            {analysis.product_portfolio.apis && analysis.product_portfolio.apis.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  APIs
                  <Badge variant="secondary" className="text-xs">{analysis.product_portfolio.apis.length}</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.product_portfolio.apis.map((api: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-sm">{api.name}</h5>
                        <div className="flex gap-1">
                          {api.pricing && (
                            <Badge variant="outline" className="text-xs">💰 {api.pricing}</Badge>
                          )}
                          {api.url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => window.open(api.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {api.description && (
                        <p className="text-xs text-muted-foreground">{api.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Development Tools & Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Development Tools */}
        {analysis.technology_analysis?.development_tools && analysis.technology_analysis.development_tools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Development Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(showAllTools ? analysis.technology_analysis.development_tools : analysis.technology_analysis.development_tools.slice(0, 8)).map((tool, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
              {analysis.technology_analysis.development_tools.length > 8 && (
                <div className="text-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllTools(!showAllTools)}
                    className="text-xs"
                  >
                    {showAllTools ? 'Show Less' : `Show All ${analysis.technology_analysis.development_tools.length} Tools`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Infrastructure & Hosting */}
        {analysis.technology_analysis?.infrastructure && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysis.technology_analysis.infrastructure).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-muted-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Technology Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Open Source & GitHub */}
        {(analysis.technology_analysis?.open_source || analysis.technology_analysis?.github_url) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Open Source & Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.technology_analysis.github_url && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">GitHub</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => window.open(analysis.technology_analysis.github_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                )}
                {analysis.technology_analysis.tech_blog_url && (
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Tech Blog</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => window.open(analysis.technology_analysis.tech_blog_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                )}
                {analysis.technology_analysis.open_source && analysis.technology_analysis.open_source.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Open Source Projects</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.technology_analysis.open_source.map((project, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Integrations */}
        {analysis.technology_analysis?.apis_used && analysis.technology_analysis.apis_used.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                API Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.technology_analysis.apis_used.map((api, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {api}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Platform & Infrastructure */}
      {analysis.technology_analysis?.platforms && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Platform & Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analysis.technology_analysis.platforms).map(([platform, details]) => (
                <div key={platform} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-blue-100 rounded">
                      {platform.toLowerCase().includes('cloud') && <Cloud className="h-4 w-4 text-blue-600" />}
                      {platform.toLowerCase().includes('mobile') && <Smartphone className="h-4 w-4 text-blue-600" />}
                      {platform.toLowerCase().includes('web') && <Globe className="h-4 w-4 text-blue-600" />}
                      {!platform.toLowerCase().includes('cloud') && !platform.toLowerCase().includes('mobile') && !platform.toLowerCase().includes('web') && <Database className="h-4 w-4 text-blue-600" />}
                    </div>
                    <h4 className="font-medium capitalize">{platform.replace(/_/g, ' ')}</h4>
                  </div>
                  {typeof details === 'string' ? (
                    <p className="text-sm text-muted-foreground">{details}</p>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(details).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Innovation Metrics */}
      {analysis.technology_analysis?.innovation_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Innovation Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysis.technology_analysis.innovation_metrics).map(([metric, value]) => {
                const formatKey = (k: string) => 
                  k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatKey(metric)}</span>
                      <span className="text-sm text-muted-foreground">
                        {typeof value === 'number' && value <= 100 ? `${value}%` : String(value)}
                      </span>
                    </div>
                    {typeof value === 'number' && value <= 100 && (
                      <Progress value={value} className="h-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technology Analysis Summary */}
      {analysis.technology_analysis?.summary && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Technology Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {analysis.technology_analysis.summary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};