
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApiStatusData } from '@/types/api';

interface ApiStatusHeaderProps {
  statusData: ApiStatusData[];
}

const ApiStatusHeader: React.FC<ApiStatusHeaderProps> = ({ statusData }) => {
  // ⚠️ PROTECTED: Safe property access with fallbacks
  const totalApis = statusData?.length || 0;
  const workingApis = statusData?.filter(api => 
    api.status === 'active' || (api as any).isWorking === true
  ).length || 0;
  const failingApis = totalApis - workingApis;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalApis}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Working APIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{workingApis}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{failingApis}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiStatusHeader;
