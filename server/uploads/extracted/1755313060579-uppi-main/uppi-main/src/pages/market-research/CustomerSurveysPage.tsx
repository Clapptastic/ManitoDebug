import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Users, Plus, Send, BarChart3, Download, Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

interface SurveyQuestion {
  id: string;
  type: 'text' | 'multiple-choice' | 'rating' | 'yes-no';
  question: string;
  options?: string[];
  required: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  status: 'draft' | 'active' | 'completed';
  responses: number;
  created_at: string;
}

export const CustomerSurveysPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  // SEO: canonical URL and structured data for Customer Surveys
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/market-research/customer-surveys` : '/market-research/customer-surveys';
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Customer Surveys",
    description: "Create and manage customer surveys for market research.",
    url: canonicalUrl
  };

  const [surveys, setSurveys] = useState<Survey[]>([
    {
      id: '1',
      title: 'Product Market Fit Survey',
      description: 'Understand how well our product meets market needs',
      questions: [],
      status: 'active',
      responses: 127,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      title: 'Customer Satisfaction Survey',
      description: 'Measure customer satisfaction and identify improvement areas',
      questions: [],
      status: 'completed',
      responses: 89,
      created_at: '2024-01-10'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'responses'>('overview');
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: [] as SurveyQuestion[]
  });

  const [newQuestion, setNewQuestion] = useState({
    type: 'text' as SurveyQuestion['type'],
    question: '',
    options: [''],
    required: false
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access customer surveys
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast({
        title: 'Question Required',
        description: 'Please enter a question before adding',
        variant: 'destructive'
      });
      return;
    }

    const question: SurveyQuestion = {
      id: Date.now().toString(),
      type: newQuestion.type,
      question: newQuestion.question,
      options: newQuestion.type === 'multiple-choice' ? newQuestion.options.filter(o => o.trim()) : undefined,
      required: newQuestion.required
    };

    setNewSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));

    setNewQuestion({
      type: 'text',
      question: '',
      options: [''],
      required: false
    });

    toast({
      title: 'Question Added',
      description: 'Question has been added to your survey'
    });
  };

  const createSurvey = () => {
    if (!newSurvey.title.trim() || newSurvey.questions.length === 0) {
      toast({
        title: 'Survey Incomplete',
        description: 'Please add a title and at least one question',
        variant: 'destructive'
      });
      return;
    }

    const survey: Survey = {
      id: Date.now().toString(),
      title: newSurvey.title,
      description: newSurvey.description,
      questions: newSurvey.questions,
      status: 'draft',
      responses: 0,
      created_at: new Date().toISOString().split('T')[0]
    };

    setSurveys(prev => [...prev, survey]);
    setNewSurvey({ title: '', description: '', questions: [] });
    setActiveTab('overview');

    toast({
      title: 'Survey Created',
      description: 'Your survey has been created successfully'
    });
  };

  const getStatusColor = (status: Survey['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Helmet>
        <title>Customer Surveys | Market Research</title>
        <meta name="description" content="Create and manage customer surveys to collect feedback and insights." />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/market-research')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Market Research
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Customer Surveys</h1>
            <p className="text-muted-foreground">
              Create and manage customer feedback surveys to gather valuable market insights
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            <Users className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Survey
          </Button>
          <Button
            variant={activeTab === 'responses' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('responses')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{surveys.length}</div>
                  <p className="text-xs text-muted-foreground">Active surveys</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{surveys.reduce((acc, s) => acc + s.responses, 0)}</div>
                  <p className="text-xs text-muted-foreground">Across all surveys</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">67%</div>
                  <p className="text-xs text-muted-foreground">Industry benchmark: 45%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-muted-foreground">High engagement</p>
                </CardContent>
              </Card>
            </div>

            {/* Surveys List */}
            <div className="grid gap-4">
              {surveys.map((survey) => (
                <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{survey.title}</CardTitle>
                        <CardDescription>{survey.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(survey.status)}>
                        {survey.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span>{survey.responses} responses</span>
                        <span>Created {survey.created_at}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create Survey Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Survey Details</CardTitle>
                <CardDescription>
                  Provide basic information about your survey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Survey Title *</Label>
                  <Input
                    id="title"
                    value={newSurvey.title}
                    onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Product Feedback Survey"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSurvey.description}
                    onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of survey purpose and goals"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Survey Questions ({newSurvey.questions.length})</CardTitle>
                <CardDescription>
                  Add questions to gather specific feedback from your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Questions */}
                {newSurvey.questions.map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {index + 1}. {question.question}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <p className="text-sm text-muted-foreground capitalize">{question.type} question</p>
                        {question.options && (
                          <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                            {question.options.map((option, i) => (
                              <li key={i}>{option}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  </div>
                ))}

                {/* Add New Question */}
                <div className="p-4 border-2 border-dashed rounded-lg">
                  <h4 className="font-medium mb-4">Add New Question</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="questionType">Question Type</Label>
                      <Select value={newQuestion.type} onValueChange={(value: any) => setNewQuestion(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Response</SelectItem>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="rating">Rating Scale</SelectItem>
                          <SelectItem value="yes-no">Yes/No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="questionText">Question Text</Label>
                      <Input
                        id="questionText"
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                        placeholder="Enter your question"
                      />
                    </div>

                    {newQuestion.type === 'multiple-choice' && (
                      <div>
                        <Label>Answer Options</Label>
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2 mt-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options];
                                newOptions[index] = e.target.value;
                                setNewQuestion(prev => ({ ...prev, options: newOptions }));
                              }}
                              placeholder={`Option ${index + 1}`}
                            />
                            {index === newQuestion.options.length - 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setNewQuestion(prev => ({ ...prev, options: [...prev.options, ''] }))}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        checked={newQuestion.required}
                        onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, required: !!checked }))}
                      />
                      <Label htmlFor="required">Required question</Label>
                    </div>

                    <Button onClick={addQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('overview')}>
                    Cancel
                  </Button>
                  <Button onClick={createSurvey}>
                    <Send className="h-4 w-4 mr-2" />
                    Create Survey
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'responses' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Survey Analytics</CardTitle>
                <CardDescription>
                  Analyze response patterns and customer feedback trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed response analytics, sentiment analysis, and trend insights will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default CustomerSurveysPage;
