import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdvancedPackageManager from '@/components/admin/AdvancedPackageManager';
import { Package } from 'lucide-react';

const AdvancedPackageManagerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Advanced Package Manager"
        description="Manage dependencies with security scanning and automated updates"
        icon={<Package className="h-6 w-6" />}
      />
      <AdvancedPackageManager />
    </div>
  );
};

export default AdvancedPackageManagerPage;