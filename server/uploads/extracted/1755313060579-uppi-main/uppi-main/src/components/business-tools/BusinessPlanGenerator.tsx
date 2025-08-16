import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, Target, TrendingUp, DollarSign, Users, Download, Plus, Save, Calendar, Building } from 'lucide-react';

interface BusinessPlan {
  id: string;
  title: string;
  industry: string;
  business_model: string;
  status: string;
  plan_data: any;
  financial_projections: any;
  metadata: any;
  version: number;
  template_used: string;
  created_at: string;
  updated_at: string;
}

interface PlanSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  order: number;
}

export const BusinessPlanGenerator: React.FC = () => {
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<BusinessPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessModel, setBusinessModel] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');

  // Plan sections
  const [planSections, setPlanSections] = useState<PlanSection[]>([
    { id: 'executive_summary', title: 'Executive Summary', content: '', completed: false, order: 1 },
    { id: 'company_description', title: 'Company Description', content: '', completed: false, order: 2 },
    { id: 'market_analysis', title: 'Market Analysis', content: '', completed: false, order: 3 },
    { id: 'organization', title: 'Organization & Management', content: '', completed: false, order: 4 },
    { id: 'products_services', title: 'Products & Services', content: '', completed: false, order: 5 },
    { id: 'marketing_sales', title: 'Marketing & Sales', content: '', completed: false, order: 6 },
    { id: 'funding_request', title: 'Funding Request', content: '', completed: false, order: 7 },
    { id: 'financial_projections', title: 'Financial Projections', content: '', completed: false, order: 8 },
    { id: 'appendix', title: 'Appendix', content: '', completed: false, order: 9 }
  ]);

  useEffect(() => {
    fetchBusinessPlans();
  }, []);

  const fetchBusinessPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching business plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch business plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBusinessPlan = async () => {
    if (!businessName.trim() || !industry.trim() || !businessModel.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const planData = {
        business_name: businessName,
        industry,
        business_model: businessModel,
        target_market: targetMarket,
        problem_statement: problemStatement,
        solution,
        funding_goal: fundingGoal,
        sections: planSections
      };

      const financialProjections = {
        startup_costs: generateStartupCosts(),
        revenue_projections: generateRevenueProjections(),
        expense_projections: generateExpenseProjections(),
        break_even_analysis: generateBreakEvenAnalysis(),
        funding_requirements: fundingGoal
      };

      const businessPlanData = {
        user_id: user.id,
        title: `${businessName} Business Plan`,
        industry,
        business_model: businessModel,
        status: 'draft',
        plan_data: JSON.stringify(planData),
        financial_projections: JSON.stringify(financialProjections),
        metadata: JSON.stringify({
          completion_percentage: 0,
          generated_at: new Date().toISOString(),
          template: 'standard'
        }),
        version: 1,
        template_used: 'standard'
      };

      const { data, error } = await supabase
        .from('business_plans')
        .insert([businessPlanData])
        .select()
        .single();

      if (error) throw error;

      // Generate AI content for each section
      await generateAIContent(data.id, planData);

      setPlans([data, ...plans]);
      setCurrentPlan(data);
      
      // Reset form
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Business plan generated successfully',
      });
    } catch (error) {
      console.error('Error generating business plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate business plan',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateAIContent = async (planId: string, planData: any) => {
    // Simulate AI content generation for each section
    const generatedSections = planSections.map(section => ({
      ...section,
      content: generateSectionContent(section.id, planData),
      completed: true
    }));

    setPlanSections(generatedSections);

    // Update the plan with generated content
      const { error } = await supabase
        .from('business_plans')
        .update({
          plan_data: JSON.stringify({ ...planData, sections: generatedSections }),
          metadata: JSON.stringify({ completion_percentage: 100, generated_at: new Date().toISOString() })
        })
        .eq('id', planId);

    if (error) {
      console.error('Error updating plan with AI content:', error);
    }
  };

  const generateSectionContent = (sectionId: string, planData: any) => {
    // Mock AI-generated content for each section
    const templates: Record<string, string> = {
      executive_summary: `${planData.business_name} is a ${planData.business_model} company in the ${planData.industry} industry. Our mission is to ${planData.solution}. We are seeking ${planData.funding_goal} in funding to scale our operations and capture market share.`,
      
      company_description: `${planData.business_name} was founded to address the critical problem of ${planData.problem_statement}. Our innovative solution leverages cutting-edge technology to deliver exceptional value to our target market of ${planData.target_market}.`,
      
      market_analysis: `The ${planData.industry} market represents a significant opportunity with growing demand for solutions like ours. Our target market of ${planData.target_market} has shown strong interest in our value proposition.`,
      
      organization: `Our founding team brings together expertise in technology, business development, and industry knowledge. We have assembled a team of experienced professionals committed to executing our vision.`,
      
      products_services: `Our core offering addresses ${planData.problem_statement} through ${planData.solution}. We utilize a ${planData.business_model} model to deliver sustainable value to our customers.`,
      
      marketing_sales: `Our go-to-market strategy focuses on reaching ${planData.target_market} through digital marketing channels, strategic partnerships, and direct sales efforts. We will leverage data-driven approaches to optimize customer acquisition.`,
      
      funding_request: `We are seeking ${planData.funding_goal} to fund product development, market expansion, and team growth. This investment will enable us to achieve profitability and establish market leadership.`,
      
      financial_projections: 'Our financial projections show strong growth potential with break-even expected within 18-24 months. Revenue projections are based on conservative market penetration estimates.',
      
      appendix: 'Additional supporting documents, market research data, and technical specifications are available upon request.'
    };

    return templates[sectionId] || `Content for ${sectionId} section would be generated here based on your inputs.`;
  };

  const generateStartupCosts = () => ({
    product_development: 50000,
    marketing_advertising: 25000,
    equipment_technology: 15000,
    legal_professional: 10000,
    working_capital: 30000,
    total: 130000
  });

  const generateRevenueProjections = () => ({
    year1: 120000,
    year2: 350000,
    year3: 750000,
    year4: 1200000,
    year5: 1800000
  });

  const generateExpenseProjections = () => ({
    year1: 100000,
    year2: 280000,
    year3: 525000,
    year4: 840000,
    year5: 1260000
  });

  const generateBreakEvenAnalysis = () => ({
    break_even_point: '18 months',
    break_even_revenue: 280000,
    units_to_break_even: 2800
  });

  const resetForm = () => {
    setBusinessName('');
    setIndustry('');
    setBusinessModel('');
    setTargetMarket('');
    setProblemStatement('');
    setSolution('');
    setFundingGoal('');
  };

  const savePlan = async () => {
    if (!currentPlan) return;

    try {
      const { error } = await supabase
        .from('business_plans')
        .update({
          plan_data: JSON.stringify({ ...currentPlan.plan_data, sections: planSections }),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPlan.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Business plan saved successfully',
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save business plan',
        variant: 'destructive',
      });
    }
  };

  const exportPlan = async () => {
    if (!currentPlan) return;

    try {
      const planContent = planSections.map(section => 
        `# ${section.title}\n\n${section.content}\n\n`
      ).join('');

      const blob = new Blob([planContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPlan.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Business plan exported successfully',
      });
    } catch (error) {
      console.error('Error exporting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to export business plan',
        variant: 'destructive',
      });
    }
  };

  const getCompletionPercentage = () => {
    const completedSections = planSections.filter(section => section.completed).length;
    return Math.round((completedSections / planSections.length) * 100);
  };

  if (currentPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPlan(null)}
          >
            ← Back to Plans
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={savePlan}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={exportPlan}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {currentPlan.title}
            </CardTitle>
            <CardDescription>
              {currentPlan.industry} • {currentPlan.business_model} • Version {currentPlan.version}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Completion</p>
                  <Progress value={getCompletionPercentage()} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">{getCompletionPercentage()}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-sm">{currentPlan.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Model</p>
                  <p className="text-sm">{currentPlan.business_model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm">{new Date(currentPlan.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sections">Plan Sections</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="export">Export Options</TabsTrigger>
              </TabsList>

              <TabsContent value="sections" className="space-y-4">
                <div className="space-y-4">
                  {planSections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <Badge variant={section.completed ? "default" : "secondary"}>
                            {section.completed ? "Complete" : "Draft"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={section.content}
                          onChange={(e) => {
                            const updatedSections = planSections.map(s =>
                              s.id === section.id ? { ...s, content: e.target.value, completed: true } : s
                            );
                            setPlanSections(updatedSections);
                          }}
                          placeholder={`Enter content for ${section.title}...`}
                          rows={4}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Revenue Projections</h4>
                        <div className="space-y-2">
                          {Object.entries((typeof currentPlan.financial_projections === 'string' ? JSON.parse(currentPlan.financial_projections) : currentPlan.financial_projections)?.revenue_projections || {}).map(([year, amount]) => (
                            <div key={year} className="flex justify-between">
                              <span className="capitalize">{year}:</span>
                              <span className="font-medium">${(amount as number).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Startup Costs</h4>
                        <div className="space-y-2">
                          {Object.entries((typeof currentPlan.financial_projections === 'string' ? JSON.parse(currentPlan.financial_projections) : currentPlan.financial_projections)?.startup_costs || {}).map(([category, amount]) => (
                            <div key={category} className="flex justify-between">
                              <span className="capitalize">{category.replace('_', ' ')}:</span>
                              <span className="font-medium">${(amount as number).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>Choose how you'd like to export your business plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={exportPlan}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as Text File
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF (Coming Soon)
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Export Financial Projections (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Plan Generator</h2>
          <p className="text-muted-foreground">Create comprehensive business plans with AI assistance</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Plan</TabsTrigger>
          <TabsTrigger value="existing">My Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Business Plan</CardTitle>
              <CardDescription>Provide basic information about your business to generate a comprehensive plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name *</label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry *</label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Model *</label>
                  <Select value={businessModel} onValueChange={setBusinessModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                      <SelectItem value="B2C">B2C (Business to Consumer)</SelectItem>
                      <SelectItem value="SaaS">SaaS (Software as a Service)</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Funding Goal</label>
                  <Input
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                    placeholder="e.g., $500,000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Market</label>
                <Input
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="Describe your target customers"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Problem Statement</label>
                <Textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="What problem does your business solve?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Solution</label>
                <Textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How does your business solve this problem?"
                  rows={3}
                />
              </div>

              <Button
                onClick={generateBusinessPlan}
                disabled={generating || !businessName.trim() || !industry.trim() || !businessModel.trim()}
                className="w-full"
              >
                {generating ? 'Generating Business Plan...' : 'Generate Business Plan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading business plans...</div>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No business plans yet</h3>
                <p className="text-muted-foreground mb-4">Create your first business plan to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <Badge variant="secondary">{plan.status}</Badge>
                    </div>
                    <CardDescription>
                      {plan.industry} • {plan.business_model}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Version:</span>
                          <p className="font-medium">{plan.version}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Template:</span>
                          <p className="font-medium capitalize">{plan.template_used}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground text-sm">Created:</span>
                        <p className="text-sm font-medium">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setCurrentPlan(plan)}
                      >
                        View & Edit Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};