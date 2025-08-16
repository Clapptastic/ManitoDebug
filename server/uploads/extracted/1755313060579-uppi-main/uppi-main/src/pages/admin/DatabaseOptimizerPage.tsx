import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import DatabaseOptimizer from '@/components/admin/DatabaseOptimizer';
import { Database } from 'lucide-react';

const DatabaseOptimizerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Database Optimizer"
        description="Monitor and optimize database performance with advanced analytics"
        icon={<Database className="h-6 w-6" />}
      />
      <DatabaseOptimizer />
    </div>
  );
};

export default DatabaseOptimizerPage;