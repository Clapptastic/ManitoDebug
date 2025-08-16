import React from 'react';
import { SafeDashboardStats } from '@/components/dashboard/SafeDashboardStats';
import { RecentAnalyses } from '@/components/dashboard/RecentAnalyses';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';
import { QuickActions } from '@/components/dashboard/QuickActions';

const Dashboard: React.FC = () => {
  console.log('Dashboard: Component rendering');
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your entrepreneurship platform
        </p>
      </div>

      {/* Safe stats with error isolation */}
      <SafeDashboardStats />

      {/* Recent activity and quick actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentAnalyses />
        <RecentDocuments />
      </div>

      {/* Quick actions for navigation */}
      <QuickActions />
    </div>
  );
};

export default Dashboard;