import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MicroservicesOverview from '@/components/admin/microservices/MicroservicesOverview';
import MicroservicesGrid from '@/components/admin/microservices/MicroservicesGrid';
import AddMicroserviceForm from '@/components/admin/microservices/AddMicroserviceForm';
import DockerIntegrationForm from '@/components/admin/microservices/DockerIntegrationForm';
import ServiceHealthMonitor from '@/components/admin/microservices/ServiceHealthMonitor';

export default function MicroservicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Microservices</h1>
        <p className="text-muted-foreground">Manage and monitor edge functions and microservices</p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="add">Add Service</TabsTrigger>
          <TabsTrigger value="docker">Docker</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <MicroservicesOverview />
        </TabsContent>
        
        <TabsContent value="services" className="space-y-6">
          <MicroservicesGrid />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          <AddMicroserviceForm />
        </TabsContent>
        
        <TabsContent value="docker" className="space-y-6">
          <DockerIntegrationForm />
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-6">
          <ServiceHealthMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}