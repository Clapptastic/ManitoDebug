/**
 * Implementation Progress Component
 * Tracks and displays progress of the comprehensive implementation plan
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, AlertCircle, Target, Calendar, BarChart3 } from 'lucide-react';

interface PhaseProgress {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'complete' | 'blocked';
  progress: number;
  estimatedCompletion: string;
  overallPercent: number;
  tasks: TaskProgress[];
  startDate?: string;
  completedDate?: string;
}

interface TaskProgress {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'complete' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
}

export const ImplementationProgress: React.FC = () => {
  const [phases, setPhases] = useState<PhaseProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(4); // Current: Phase 0 complete
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadImplementationData();
  }, []);

  const loadImplementationData = () => {
    // Initial implementation progress data
    const initialPhases: PhaseProgress[] = [
      {
        id: 'phase-0',
        name: 'Foundation Audit & Database Migrations',
        status: 'complete',
        progress: 100,
        estimatedCompletion: 'Week 1',
        overallPercent: 4,
        startDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        tasks: [
          {
            id: 'db-migrations',
            name: 'Core Database Migrations',
            status: 'complete',
            priority: 'critical'
          },
          {
            id: 'rls-policies',
            name: 'RLS Policy Setup',
            status: 'complete',
            priority: 'critical'
          },
          {
            id: 'business-tools-service',
            name: 'Business Tools Service',
            status: 'complete',
            priority: 'high'
          }
        ]
      },
      {
        id: 'phase-1',
        name: 'Core Platform Development',
        status: 'in_progress',
        progress: 15,
        estimatedCompletion: 'Week 2-12',
        overallPercent: 32,
        startDate: new Date().toISOString(),
        tasks: [
          {
            id: 'business-tools-dashboard',
            name: 'Business Tools Dashboard',
            status: 'complete',
            priority: 'high'
          },
          {
            id: 'mvp-builder',
            name: 'MVP Builder Integration',
            status: 'in_progress',
            priority: 'high'
          },
          {
            id: 'competitor-analysis',
            name: 'Competitor Analysis Enhancement',
            status: 'pending',
            priority: 'medium'
          },
          {
            id: 'admin-dashboard',
            name: 'Admin Dashboard Features',
            status: 'pending',
            priority: 'medium'
          }
        ]
      },
      {
        id: 'phase-9',
        name: 'Legal & Compliance Automation',
        status: 'pending',
        progress: 0,
        estimatedCompletion: 'Week 13',
        overallPercent: 36,
        tasks: [
          {
            id: 'gdpr-compliance',
            name: 'GDPR Compliance Framework',
            status: 'pending',
            priority: 'critical'
          },
          {
            id: 'data-protection',
            name: 'Data Protection Policies',
            status: 'pending',
            priority: 'critical'
          }
        ]
      },
      {
        id: 'phase-10',
        name: 'Billing & Payment System',
        status: 'pending',
        progress: 0,
        estimatedCompletion: 'Week 14',
        overallPercent: 40,
        tasks: [
          {
            id: 'stripe-integration',
            name: 'Stripe Payment Integration',
            status: 'pending',
            priority: 'critical'
          },
          {
            id: 'subscription-management',
            name: 'Subscription Management',
            status: 'pending',
            priority: 'high'
          }
        ]
      }
    ];

    setPhases(initialPhases);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      complete: 'default',
      in_progress: 'secondary',
      blocked: 'destructive',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const completedPhases = phases.filter(p => p.status === 'complete').length;
  const totalPhases = 25; // Total phases in the plan

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementation Progress</h1>
          <p className="text-muted-foreground">
            Comprehensive implementation plan tracking and monitoring
          </p>
        </div>
        <Button onClick={loadImplementationData} variant="outline">
          Refresh Progress
        </Button>
      </div>

      {/* Overall Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedPhases} of {totalPhases} phases complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Phase</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Phase 1</div>
            <p className="text-xs text-muted-foreground">
              Core Platform Development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {phases.flatMap(p => p.tasks).filter(t => t.status === 'complete').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {phases.flatMap(p => p.tasks).length} total tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">29 weeks</div>
            <p className="text-xs text-muted-foreground">
              Estimated completion time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="phases" className="space-y-6">
        <TabsList>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-6">
          <div className="space-y-4">
            {phases.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(phase.status)}
                      <div>
                        <CardTitle className="text-lg">{phase.name}</CardTitle>
                        <CardDescription>
                          Target: {phase.estimatedCompletion} • Overall Impact: {phase.overallPercent}%
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(phase.status)}
                      <span className="text-sm font-medium">{phase.progress}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={phase.progress} className="mb-4" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Tasks ({phase.tasks.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {phase.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <span className="text-sm">{task.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks Overview</CardTitle>
              <CardDescription>
                Detailed view of all implementation tasks across phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phases.flatMap(phase => 
                  phase.tasks.map(task => ({
                    ...task,
                    phase: phase.name
                  }))
                ).map((task) => (
                  <div 
                    key={`${task.phase}-${task.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-muted-foreground">{task.phase}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription>
                Visual timeline of all implementation phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {phases.map((phase, index) => (
                  <div key={phase.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        phase.status === 'complete' ? 'bg-green-500 border-green-500' :
                        phase.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                        'bg-gray-200 border-gray-300'
                      }`} />
                      {index < phases.length - 1 && (
                        <div className="w-px h-12 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{phase.name}</h3>
                        <Badge variant="outline">{phase.estimatedCompletion}</Badge>
                      </div>
                      <Progress value={phase.progress} className="mt-2 w-full max-w-md" />
                      <p className="text-sm text-muted-foreground mt-1">
                        {phase.tasks.length} tasks • {phase.progress}% complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};