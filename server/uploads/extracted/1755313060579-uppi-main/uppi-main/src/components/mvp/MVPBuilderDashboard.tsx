/**
 * MVP Builder Dashboard Component
 * Interface for creating and managing MVP projects
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MVPBuilderService, type MVPTemplate } from '@/services/mvpBuilderService';
import { BusinessToolsService } from '@/services/businessToolsService';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Plus, Clock, CheckCircle, BarChart3, Lightbulb, Code, Zap } from 'lucide-react';

export const MVPBuilderDashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<MVPTemplate[]>([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageCompletionTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MVPTemplate | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    template: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await BusinessToolsService.trackToolUsage('mvp-builder');
      
      const [projectsData, metricsData] = await Promise.all([
        MVPBuilderService.getUserProjects(),
        MVPBuilderService.getMVPMetrics()
      ]);

      const templatesData = MVPBuilderService.getMVPTemplates();

      setProjects(projectsData);
      setMetrics(metricsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading MVP dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load MVP dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!createForm.name.trim()) {
        toast({
          title: 'Error',
          description: 'Project name is required',
          variant: 'destructive'
        });
        return;
      }

      await MVPBuilderService.createProject({
        name: createForm.name,
        description: createForm.description,
        template: createForm.template,
        metadata: selectedTemplate ? { template: selectedTemplate } : {}
      });

      toast({
        title: 'Success',
        description: 'MVP project created successfully',
      });

      setShowCreateDialog(false);
      setCreateForm({ name: '', description: '', template: '' });
      setSelectedTemplate(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create MVP project',
        variant: 'destructive'
      });
    }
  };

  const getComplexityBadge = (complexity: string) => {
    const variants = {
      simple: 'default',
      moderate: 'secondary', 
      complex: 'destructive'
    } as const;

    return (
      <Badge variant={variants[complexity as keyof typeof variants] || 'default'}>
        {complexity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'outline',
      planning: 'secondary',
      in_progress: 'default',
      completed: 'default',
      on_hold: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MVP Builder</h1>
          <p className="text-muted-foreground">
            Build and launch your minimum viable product quickly
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New MVP Project</DialogTitle>
              <DialogDescription>
                Start building your minimum viable product
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your MVP"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Template (Optional)</label>
                <Select
                  value={createForm.template}
                  onValueChange={(value) => {
                    setCreateForm(prev => ({ ...prev, template: value }));
                    const template = templates.find(t => t.id === value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.icon} {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              All MVP projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently in development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Successfully launched
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionTime}d</div>
            <p className="text-xs text-muted-foreground">
              Days to completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Rocket className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No MVP projects yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first MVP project to get started with rapid prototyping
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    {project.description && (
                      <CardDescription>{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {project.status === 'completed' ? '100%' : 
                           project.status === 'in_progress' ? '65%' :
                           project.status === 'planning' ? '25%' : '0%'}
                        </span>
                      </div>
                      <Progress 
                        value={
                          project.status === 'completed' ? 100 : 
                          project.status === 'in_progress' ? 65 :
                          project.status === 'planning' ? 25 : 0
                        } 
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{template.icon}</span>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    {getComplexityBadge(template.complexity)}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Est. Time:</span>
                      <span className="font-medium">{template.estimatedTimeWeeks} weeks</span>
                    </div>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setCreateForm(prev => ({ ...prev, template: template.id }));
                        setShowCreateDialog(true);
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>MVP Development Roadmap</span>
              </CardTitle>
              <CardDescription>
                Standard phases for building a successful MVP
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-6">
                  {MVPBuilderService.generateRoadmap(selectedTemplate).map((phase, index) => (
                    <div key={index} className="border-l-2 border-muted pl-6 pb-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-3 h-3 bg-primary rounded-full -ml-8 border-2 border-background" />
                        <h3 className="font-medium">{phase.phase}</h3>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Tasks</h4>
                          <ul className="text-sm space-y-1">
                            {phase.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className="flex items-center space-x-2">
                                <Code className="w-3 h-3 text-muted-foreground" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Deliverables</h4>
                          <div className="flex flex-wrap gap-1">
                            {phase.deliverables.map((deliverable, delIndex) => (
                              <Badge key={delIndex} variant="secondary" className="text-xs">
                                {deliverable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a template to view the detailed development roadmap
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};