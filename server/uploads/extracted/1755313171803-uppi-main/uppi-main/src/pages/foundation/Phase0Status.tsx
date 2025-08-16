/**
 * Phase 0: Foundation Status Page
 * Shows Phase 0 completion status and validation results
 */

import React from 'react';
import { FoundationStatus } from '@/components/foundation/FoundationStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Phase0Status: React.FC = () => {
  const phase0Tasks = [
    {
      id: '0.1.1',
      title: 'Core Database Migrations',
      status: 'completed',
      description: 'Created foundational database tables with RLS policies'
    },
    {
      id: '0.1.2', 
      title: 'Foundation Services',
      status: 'completed',
      description: 'Implemented DatabaseService and ValidationService'
    },
    {
      id: '0.1.3',
      title: 'Foundation Components',
      status: 'completed', 
      description: 'Created FoundationStatus component and Phase0Status page'
    },
    {
      id: '0.2.1',
      title: 'Business Pages Consolidation',
      status: 'completed',
      description: 'Consolidated BusinessToolsPage and TestMeasureLearnPage duplicates'
    },
    {
      id: '0.2.2',
      title: 'Analytics Components Consolidation',
      status: 'completed',
      description: 'Consolidated AdvancedAnalyticsDashboard duplicates'
    },
    {
      id: '0.2.3',
      title: 'Admin Components Consolidation',
      status: 'completed',
      description: 'Consolidated admin navigation components'
    },
    {
      id: '0.3.1',
      title: 'Edge Functions Integration',
      status: 'completed',
      description: 'Documented and audited all edge functions'
    },
    {
      id: '0.4.1',
      title: 'Performance Optimization',
      status: 'pending',
      description: 'Add database indexes and optimize queries'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      'in-progress': 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const completedTasks = phase0Tasks.filter(task => task.status === 'completed').length;
  const totalTasks = phase0Tasks.length;
  const completionPercentage = (completedTasks / totalTasks) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Phase 0: Foundation Status</h1>
        <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
          {completionPercentage.toFixed(0)}% Complete
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FoundationStatus />
        
        <Card>
          <CardHeader>
            <CardTitle>Phase 0 Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Key Milestones:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Database foundation established</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Core services implemented</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Foundation components created</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                    <span>Component consolidation pending</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Task Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phase0Tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <h4 className="font-medium">{task.id}: {task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                </div>
                {getStatusBadge(task.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Phase 0 foundation is {completionPercentage.toFixed(0)}% complete. 
              {completionPercentage === 100 
                ? " Ready to proceed to Phase 1!" 
                : " Complete remaining tasks before moving to Phase 1."
              }
            </p>
            
            {completionPercentage < 100 && (
              <div className="space-y-2">
                <h4 className="font-medium">Immediate Actions Required:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {phase0Tasks
                    .filter(task => task.status !== 'completed')
                    .map(task => (
                      <li key={task.id}>{task.title}</li>
                    ))
                  }
                </ul>
              </div>
            )}
            
            {completionPercentage === 100 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  🎉 Phase 0 foundation is complete! You can now proceed to Phase 1: Core Platform implementation.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase0Status;