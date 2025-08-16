import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { VaultAuditPanel } from '@/components/admin/VaultAuditPanel';
import { Shield } from 'lucide-react';

const VaultAuditPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vault System Audit"
        description="Comprehensive audit and testing of Supabase vault configuration for secure API key management"
        icon={<Shield />}
      />
      
      <VaultAuditPanel />
    </div>
  );
};

export default VaultAuditPage;