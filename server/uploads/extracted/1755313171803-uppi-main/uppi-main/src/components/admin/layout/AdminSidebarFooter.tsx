import React from 'react';
import { Activity } from 'lucide-react';
import { SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const AdminSidebarFooter: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Mock system status - in real app this would come from a service
  const systemStatus = {
    status: 'operational', // 'operational' | 'warning' | 'error'
    uptime: '99.9%',
    lastChecked: new Date().toLocaleTimeString()
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'operational': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  if (isCollapsed) {
    return (
      <SidebarFooter className="p-2 border-t border-border">
        <div className="flex flex-col space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Activity className={cn("h-4 w-4", getStatusColor(systemStatus.status))} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="space-y-1">
                  <p className="font-medium">System Status</p>
                  <p className="text-xs">Status: {systemStatus.status}</p>
                  <p className="text-xs">Uptime: {systemStatus.uptime}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarFooter>
    );
  }

  return null;
};