import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import SecurityAuditDashboard from '@/components/admin/SecurityAuditDashboard';
import { Shield } from 'lucide-react';

const SecurityAuditPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Security Audit"
        description="Comprehensive security analysis and compliance monitoring"
        icon={<Shield className="h-6 w-6" />}
      />
      <SecurityAuditDashboard />
    </div>
  );
};

export default SecurityAuditPage;