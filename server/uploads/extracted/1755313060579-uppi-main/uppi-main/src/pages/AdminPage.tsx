import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { SystemHealthMonitor } from '@/components/admin/SystemHealthMonitor';
import { PackageManager } from '@/components/admin/PackageManager';
// import { WorkflowBuilder } from '@/components/automation/WorkflowBuilder';
// import { IntegrationHub } from '@/components/integrations/IntegrationHub';
import { Shield, Activity, Package, Workflow, Zap, Database } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage system settings, monitor health, and configure automations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="datapoints" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Points
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="packages" className="space-y-6">
          <PackageManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Workflow automation features coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Integration hub features coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="datapoints" className="space-y-6">
          <iframe 
            src="/admin/data-points-management" 
            className="w-full h-[800px] border rounded-lg"
            title="Data Points Management"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;