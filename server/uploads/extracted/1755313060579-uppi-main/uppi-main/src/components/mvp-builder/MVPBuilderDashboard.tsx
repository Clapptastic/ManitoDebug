import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useMVPBuilder } from '@/hooks/useMVPBuilder';
import { MVPBuilderService } from '@/services/mvpBuilderService';
import { Plus, Rocket, Target, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

export const MVPBuilderDashboard = () => {
  const {
    projects,
    currentProject,
    isLoading,
    loadProjects,
    createProject,
    setCurrentProject
  } = useMVPBuilder();

  const [activeTab, setActiveTab] = useState('overview');
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
    setTemplates(MVPBuilderService.getMVPTemplates());
  }, [loadProjects]);

  const handleCreateProject = async () => {
    try {
      await createProject({
        title: 'New MVP Project',
        description: 'A new MVP project to validate your business idea',
        template: 'saas-dashboard',
        metadata: {
          features: [],
          roadmap: [],
          budget: 0,
          status: 'planning'
        }
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'planning': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'testing': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'planning': return 'Planning';
      case 'in_progress': return 'Development';
      case 'testing': return 'Testing';
      case 'completed': return 'Launched';
      default: return 'Unknown';
    }
  };

  const getProjectProgress = (project: any) => {
    const status = project.status;
    switch (status) {
      case 'draft': return 10;
      case 'planning': return 25;
      case 'in_progress': return 60;
      case 'testing': return 85;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MVP Builder</h1>
          <p className="text-muted-foreground">
            Build, validate, and launch your minimum viable product
          </p>
        </div>
        <Button onClick={handleCreateProject} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          New MVP Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-muted-foreground">Active MVP projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Development</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently building</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">Live products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">Available templates</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No MVP Projects Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first MVP project to start building your product.
                  </p>
                  <Button onClick={handleCreateProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First MVP
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setCurrentProject(project)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{project.name}</h4>
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Progress: {getProjectProgress(project)}%</span>
                            <Progress value={getProjectProgress(project)} className="w-24 h-2" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {project.metadata?.template || 'Custom'}
                        </p>
                        <p className="text-xs text-muted-foreground">Template</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground">
                    Start building your MVP by creating a new project.
                  </p>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {project.name}
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {getStatusText(project.status)}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentProject(project)}
                      >
                        Open
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Template</p>
                        <p className="text-lg font-bold">
                          {project.metadata?.template || 'Custom'}
                        </p>
                        <p className="text-xs text-muted-foreground">Project type</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Created</p>
                        <p className="text-lg font-bold">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Start date</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Progress</p>
                        <Progress value={getProjectProgress(project)} className="w-full h-2 mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {getProjectProgress(project)}% complete
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.complexity}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium">Estimated Time</p>
                      <p className="text-sm">{template.estimatedTimeWeeks} weeks</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Key Features</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.features.slice(0, 3).map((feature: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={async () => {
                      await createProject({
                        title: `${template.name} Project`,
                        description: template.description,
                        template: template.id
                      });
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MVP Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Track your MVP progress, user feedback, and key metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};