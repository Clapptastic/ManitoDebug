
import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SuperAdminSetup from '@/components/admin/SuperAdminSetup';

const SetupSuperAdminPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Super Admin Setup"
        description="Configure super admin permissions and access"
        icon={<ShieldAlert className="h-6 w-6" />}
      />
      
      <Card>
        <CardContent className="pt-6">
          <SuperAdminSetup />
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupSuperAdminPage;
