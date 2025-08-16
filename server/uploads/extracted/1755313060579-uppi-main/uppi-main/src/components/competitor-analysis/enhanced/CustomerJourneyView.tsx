import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Search, 
  ShoppingCart, 
  Heart,
  Users,
  ArrowRight,
  CheckCircle,
  Target,
  Megaphone,
  CreditCard,
  Settings,
  UserCheck,
  Share2,
  Trophy,
  MessageCircle
} from 'lucide-react';
import { CompetitorAnalysisEntity } from '@/types/competitor';

interface CustomerJourneyViewProps {
  analysis: CompetitorAnalysisEntity;
}

export const CustomerJourneyView: React.FC<CustomerJourneyViewProps> = ({ analysis }) => {
  const [activeStage, setActiveStage] = useState<string>('awareness');
  const journeyData = analysis.customer_journey_data 
    || analysis.analysis_data?.customer_journey_analysis 
    || analysis.analysis_data?.results?.[0]?.customer_journey_analysis 
    || {};

  const journeyStages = [
    {
      id: 'awareness',
      title: 'Awareness',
      icon: Eye,
      color: 'bg-blue-500',
      data: journeyData.awareness_stage
    },
    {
      id: 'consideration',
      title: 'Consideration',
      icon: Search,
      color: 'bg-yellow-500',
      data: journeyData.consideration_stage
    },
    {
      id: 'purchase',
      title: 'Purchase',
      icon: ShoppingCart,
      color: 'bg-green-500',
      data: journeyData.purchase_stage
    },
    {
      id: 'retention',
      title: 'Retention',
      icon: Heart,
      color: 'bg-purple-500',
      data: journeyData.retention_stage
    },
    {
      id: 'advocacy',
      title: 'Advocacy',
      icon: Users,
      color: 'bg-orange-500',
      data: journeyData.advocacy_stage
    }
  ];

  const renderJourneyFlow = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-center">Customer Journey Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {journeyStages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.id;
            const hasData = stage.data && Object.keys(stage.data).length > 0;
            
            return (
              <div key={stage.id} className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setActiveStage(stage.id)}
                >
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-white transition-all
                    ${isActive ? stage.color : 'bg-muted'}
                    ${hasData ? 'ring-2 ring-primary ring-offset-2' : ''}
                  `}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {stage.title}
                  </span>
                  {hasData && (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  )}
                </motion.div>
                
                {index < journeyStages.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderAwarenessStage = () => {
    const data = journeyData.awareness_stage;
    if (!data) return null;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Discovery Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.discovery_channels && data.discovery_channels.length > 0 ? (
              <div className="space-y-2">
                {data.discovery_channels.map((channel: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="mr-2 mb-2">
                    {channel}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No discovery channels data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-500" />
              Brand Touchpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.brand_touchpoints && data.brand_touchpoints.length > 0 ? (
              <div className="space-y-2">
                {data.brand_touchpoints.map((touchpoint: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm">{touchpoint}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No brand touchpoints data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            {data.content_strategy ? (
              <p className="text-sm leading-relaxed">{data.content_strategy}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No content strategy data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Presence</CardTitle>
          </CardHeader>
          <CardContent>
            {data.seo_presence ? (
              <Badge variant="secondary">{data.seo_presence}</Badge>
            ) : (
              <div className="text-sm text-muted-foreground">No SEO presence data</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConsiderationStage = () => {
    const data = journeyData.consideration_stage;
    if (!data) return null;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            {data.evaluation_criteria && data.evaluation_criteria.length > 0 ? (
              <div className="space-y-2">
                {data.evaluation_criteria.map((criteria: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{criteria}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No evaluation criteria data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparison Factors</CardTitle>
          </CardHeader>
          <CardContent>
            {data.comparison_factors && data.comparison_factors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.comparison_factors.map((factor: string, idx: number) => (
                  <Badge key={idx} variant="outline">{factor}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No comparison factors data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trial Options</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trial_options && data.trial_options.length > 0 ? (
              <div className="space-y-2">
                {data.trial_options.map((option: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="mr-2 mb-2">{option}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No trial options data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Process</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sales_process ? (
              <p className="text-sm leading-relaxed">{data.sales_process}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No sales process data</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPurchaseStage = () => {
    const data = journeyData.purchase_stage;
    if (!data) return null;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500" />
              Onboarding Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.onboarding_process ? (
              <p className="text-sm leading-relaxed">{data.onboarding_process}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No onboarding process data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              Payment Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.payment_options && data.payment_options.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.payment_options.map((option: string, idx: number) => (
                  <Badge key={idx} variant="outline">{option}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No payment options data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.implementation_time ? (
              <Badge variant="secondary">{data.implementation_time}</Badge>
            ) : (
              <div className="text-sm text-muted-foreground">No implementation time data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Support</CardTitle>
          </CardHeader>
          <CardContent>
            {data.support_during_setup ? (
              <p className="text-sm leading-relaxed">{data.support_during_setup}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No setup support data</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRetentionStage = () => {
    const data = journeyData.retention_stage;
    if (!data) return null;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-500" />
              Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.success_metrics && data.success_metrics.length > 0 ? (
              <div className="space-y-2">
                {data.success_metrics.map((metric: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">{metric}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No success metrics data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Tactics</CardTitle>
          </CardHeader>
          <CardContent>
            {data.engagement_tactics && data.engagement_tactics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.engagement_tactics.map((tactic: string, idx: number) => (
                  <Badge key={idx} variant="outline">{tactic}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No engagement tactics data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loyalty_programs && data.loyalty_programs.length > 0 ? (
              <div className="space-y-2">
                {data.loyalty_programs.map((program: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="mr-2 mb-2">{program}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No loyalty programs data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn Prevention</CardTitle>
          </CardHeader>
          <CardContent>
            {data.churn_prevention && data.churn_prevention.length > 0 ? (
              <div className="space-y-2">
                {data.churn_prevention.map((strategy: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{strategy}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No churn prevention data</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAdvocacyStage = () => {
    const data = journeyData.advocacy_stage;
    if (!data) return null;

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-orange-500" />
              Referral Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.referral_programs && data.referral_programs.length > 0 ? (
              <div className="space-y-2">
                {data.referral_programs.map((program: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="mr-2 mb-2">{program}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No referral programs data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Stories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.customer_success_stories && data.customer_success_stories.length > 0 ? (
              <div className="space-y-2">
                {data.customer_success_stories.map((story: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Trophy className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">{story}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No customer success stories data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-orange-500" />
              Community Building
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.community_building ? (
              <p className="text-sm leading-relaxed">{data.community_building}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No community building data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            {data.user_generated_content ? (
              <p className="text-sm leading-relaxed">{data.user_generated_content}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No user generated content data</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStageContent = () => {
    switch (activeStage) {
      case 'awareness':
        return renderAwarenessStage();
      case 'consideration':
        return renderConsiderationStage();
      case 'purchase':
        return renderPurchaseStage();
      case 'retention':
        return renderRetentionStage();
      case 'advocacy':
        return renderAdvocacyStage();
      default:
        return <div className="text-sm text-muted-foreground">Select a stage to view details</div>;
    }
  };

  return (
    <div className="space-y-6">
      {renderJourneyFlow()}
      
      <motion.div
        key={activeStage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderStageContent()}
      </motion.div>
    </div>
  );
};