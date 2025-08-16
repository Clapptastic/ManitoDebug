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
import { Rocket, Target, Users, DollarSign, Calendar, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface MvpProject {
  id: string;
  name: string;
  description: string;
  project_type: string;
  status: string;
  features: any;
  repository_url?: string;
  deployment_url?: string;
  budget_estimate?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  effort_estimate: number;
}

export const MvpBuilder: React.FC = () => {
  const [projects, setProjects] = useState<MvpProject[]>([]);
  const [currentProject, setCurrentProject] = useState<MvpProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('web_app');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [newFeature, setNewFeature] = useState<{ name: string; description: string; priority: 'high' | 'medium' | 'low' }>({ name: '', description: '', priority: 'medium' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mvp_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching MVP projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch MVP projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const projectData = {
        user_id: user.id,
        name: projectName,
        description: projectDescription,
        project_type: projectType,
        features: JSON.stringify(features),
        status: 'planning',
        budget_estimate: calculateBudget(),
        metadata: {
          timeline_weeks: calculateTimeline(),
          progress_percentage: 0,
          target_market: []
        }
      };

      const { data, error } = await supabase
        .from('mvp_projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setCurrentProject(data);
      
      // Reset form
      setProjectName('');
      setProjectDescription('');
      setProjectType('web_app');
      setFeatures([]);
      
      toast({
        title: 'Success',
        description: 'MVP project created successfully',
      });
    } catch (error) {
      console.error('Error creating MVP project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create MVP project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.name.trim()) return;

    const feature: Feature = {
      id: Date.now().toString(),
      name: newFeature.name,
      description: newFeature.description,
      priority: newFeature.priority,
      status: 'pending',
      effort_estimate: Math.ceil(Math.random() * 8) + 1, // 1-8 hours estimate
    };

    setFeatures([...features, feature]);
    setNewFeature({ name: '', description: '', priority: 'medium' });
  };

  const removeFeature = (featureId: string) => {
    setFeatures(features.filter(f => f.id !== featureId));
  };

  const updateFeatureStatus = async (projectId: string, featureId: string, status: string) => {
    if (!currentProject) return;

    const currentFeatures = Array.isArray(currentProject.features) ? currentProject.features : (typeof currentProject.features === 'string' ? JSON.parse(currentProject.features) : []);
    const updatedFeatures = currentFeatures.map((f: Feature) =>
      f.id === featureId ? { ...f, status } : f
    );

    const progress = updatedFeatures.length > 0 ? Math.round(
      (updatedFeatures.filter((f: Feature) => f.status === 'completed').length / updatedFeatures.length) * 100
    ) : 0;

    try {
      const { error } = await supabase
        .from('mvp_projects')
        .update({
          features: JSON.stringify(updatedFeatures),
          metadata: {
            ...currentProject.metadata,
            progress_percentage: progress
          }
        })
        .eq('id', projectId);

      if (error) throw error;

      const updatedProject = {
        ...currentProject,
        features: updatedFeatures,
        metadata: {
          ...currentProject.metadata,
          progress_percentage: progress
        }
      };

      setCurrentProject(updatedProject);

      toast({
        title: 'Success',
        description: 'Feature status updated',
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature status',
        variant: 'destructive',
      });
    }
  };

  const calculateTimeline = () => {
    const totalEffort = features.reduce((sum, f) => sum + f.effort_estimate, 0);
    return Math.ceil(totalEffort / 40); // Assuming 40 hours per week
  };

  const calculateBudget = () => {
    const totalEffort = features.reduce((sum, f) => sum + f.effort_estimate, 0);
    return totalEffort * 50; // $50 per hour estimate
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentProject(null)}
          >
            ← Back to Projects
          </Button>
          <Badge variant="secondary" className="text-sm">
            {currentProject.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              {currentProject.name}
            </CardTitle>
            <CardDescription>{currentProject.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <Progress value={currentProject.metadata?.progress_percentage || 0} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">{currentProject.metadata?.progress_percentage || 0}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-lg font-bold">{currentProject.metadata?.timeline_weeks || 0} weeks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-lg font-bold">${(currentProject.budget_estimate || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm">{currentProject.project_type}</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="space-y-4">
                <div className="space-y-3">
                  {(Array.isArray(currentProject.features) ? currentProject.features : (typeof currentProject.features === 'string' ? JSON.parse(currentProject.features) : [])).map((feature: Feature) => (
                    <Card key={feature.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{feature.name}</h4>
                            <Badge className={getPriorityColor(feature.priority)}>
                              {feature.priority}
                            </Badge>
                            <Badge className={getStatusColor(feature.status)}>
                              {feature.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estimate: {feature.effort_estimate} hours
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {feature.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateFeatureStatus(
                                currentProject.id,
                                feature.id,
                                feature.status === 'pending' ? 'in_progress' : 'completed'
                              )}
                            >
                              {feature.status === 'pending' ? 'Start' : 'Complete'}
                            </Button>
                          )}
                          {feature.status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Development Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Planning Phase</span>
                        <span>Week 1</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Core Development</span>
                        <span>Weeks 2-{Math.ceil((currentProject.metadata?.timeline_weeks || 4) * 0.8)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Testing & Polish</span>
                        <span>Weeks {Math.ceil((currentProject.metadata?.timeline_weeks || 4) * 0.8) + 1}-{currentProject.metadata?.timeline_weeks || 4}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">No-Code Platforms</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Bubble.io - For web applications</li>
                          <li>• Webflow - For marketing websites</li>
                          <li>• Airtable - For database management</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Development Tools</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• React - Frontend framework</li>
                          <li>• Supabase - Backend as a Service</li>
                          <li>• Vercel - Deployment platform</li>
                        </ul>
                      </div>
                    </div>
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
          <h2 className="text-2xl font-bold">MVP Builder</h2>
          <p className="text-muted-foreground">Build and track your Minimum Viable Product</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create MVP</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New MVP Project</CardTitle>
              <CardDescription>Define your MVP requirements and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name *</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Awesome MVP"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Type</label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web_app">Web Application</SelectItem>
                      <SelectItem value="mobile_app">Mobile App</SelectItem>
                      <SelectItem value="saas">SaaS Platform</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your MVP idea and value proposition..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Features</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                    disabled={!newFeature.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={newFeature.name}
                    onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                    placeholder="Feature name"
                  />
                  <Input
                    value={newFeature.description}
                    onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                    placeholder="Feature description"
                  />
                  <Select
                    value={newFeature.priority}
                    onValueChange={(value: 'high' | 'medium' | 'low') =>
                      setNewFeature({ ...newFeature, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          <Badge className={getPriorityColor(feature.priority)}>
                            {feature.priority}
                          </Badge>
                        </div>
                        {feature.description && (
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {features.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Estimated Timeline</p>
                      <p className="text-lg font-bold">{calculateTimeline()} weeks</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated Budget</p>
                      <p className="text-lg font-bold">${calculateBudget().toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={createProject}
                disabled={loading || !projectName.trim() || !projectDescription.trim()}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create MVP Project'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No MVP projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first MVP project to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{project.metadata?.progress_percentage || 0}%</span>
                          </div>
                          <Progress value={project.metadata?.progress_percentage || 0} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Timeline:</span>
                            <p className="font-medium">{project.metadata?.timeline_weeks || 0} weeks</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Budget:</span>
                            <p className="font-medium">${(project.budget_estimate || 0).toLocaleString()}</p>
                          </div>
                        </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setCurrentProject(project)}
                      >
                        View Details
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