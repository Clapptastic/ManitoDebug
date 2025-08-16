import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPage from '@/pages/AdminPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import APIManagementPage from '@/pages/admin/APIManagementPage';
import PermissionsPage from '@/pages/admin/PermissionsPage';
import SystemHealthPage from '@/pages/admin/SystemHealthPage';
import TypeCoveragePage from '@/pages/admin/TypeCoveragePage';
import SettingsAdminPage from '@/pages/admin/SettingsPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Navigate } from 'react-router-dom';
import DevelopmentToolsPage from '@/pages/admin/DevelopmentToolsPage';
 
import AffiliateAdmin from '@/pages/admin/AffiliateAdmin';
import { LegalCompliancePage } from '@/pages/legal/LegalCompliancePage';
import NavCoverageAuditPage from '@/pages/admin/NavCoverageAuditPage';
import UnusedComponentsPage from '@/pages/admin/UnusedComponentsPage';

// Import existing pages that match navigation items
import CodeWikiPage from '@/pages/admin/CodeWikiPage';
import WikiSystemPage from '@/pages/admin/WikiSystemPage';
import CodeEmbeddingsPage from '@/pages/admin/CodeEmbeddingsPage';
import SchemaViewerPage from '@/pages/admin/SchemaViewerPage';
import DatabaseManagementPage from '@/pages/admin/DatabaseManagementPage';
import MicroservicesPage from '@/pages/admin/MicroservicesPage';
import PackageUpdatesPage from '@/pages/admin/PackageUpdatesPage';
import SuperAdminPage from '@/pages/admin/SuperAdminPage';
import { MasterProfileManagement } from '@/pages/admin/MasterProfileManagement';
import AnalysisFlowMonitorPage from '@/pages/admin/AnalysisFlowMonitorPage';
import DataPointsManagementPage from '@/pages/admin/DataPointsManagementPage';
import MasterCompanyProfiles from '@/pages/admin/MasterCompanyProfiles';
import MasterCompanyProfileDetail from '@/pages/admin/MasterCompanyProfileDetail';
import PromptManagementPage from '@/pages/admin/PromptManagementPage';
import FeatureFlagsPage from '@/pages/admin/FeatureFlagsPage';
import FlowManagementPage from '@/pages/admin/FlowManagementPage';
import SystemOptimizationPage from '@/pages/admin/SystemOptimizationPage';
import DebugFunctionsPage from '@/pages/admin/DebugFunctionsPage';
import VaultAuditPage from '@/pages/admin/VaultAuditPage';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminRoute superAdminOnly><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminPage />} />
        <Route path="dashboard" element={<AdminPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        <Route path="users" element={<Navigate to="/admin/user-management" replace />} /> {/* Redirect old path */}
        <Route path="model-management" element={<Navigate to="/admin/api-management" replace />} />
        <Route path="api-management" element={<APIManagementPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="legal-compliance" element={<LegalCompliancePage />} />
        <Route path="system-health" element={<SystemHealthPage />} />
        <Route path="type-coverage" element={<TypeCoveragePage />} />
        <Route path="settings" element={<SettingsAdminPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="dev-tools" element={<DevelopmentToolsPage />} />
        <Route path="affiliate" element={<AffiliateAdmin />} />
        <Route path="system-testing" element={<DevelopmentToolsPage />} />
        <Route path="codewiki" element={<CodeWikiPage />} />
        <Route path="wiki" element={<WikiSystemPage />} />
        <Route path="code-embeddings" element={<CodeEmbeddingsPage />} />
        <Route path="schema-viewer" element={<SchemaViewerPage />} />
        <Route path="database" element={<DatabaseManagementPage />} />
        <Route path="microservices" element={<MicroservicesPage />} />
        <Route path="package-updates" element={<PackageUpdatesPage />} />
        <Route 
          path="super-admin" 
          element={
            <AdminRoute superAdminOnly>
              <SuperAdminPage />
            </AdminRoute>
          }
        />
        <Route path="master-profiles" element={<MasterProfileManagement />} />
        <Route
          path="master-profiles/list"
          element={
            <AdminRoute superAdminOnly>
              <MasterCompanyProfiles />
            </AdminRoute>
          }
        />
        <Route
          path="master-profiles/:profileId"
          element={
            <AdminRoute superAdminOnly>
              <MasterCompanyProfileDetail />
            </AdminRoute>
          }
        />
        <Route path="analysis-flow" element={<AnalysisFlowMonitorPage />} />
        <Route 
          path="prompts" 
          element={
            <AdminRoute superAdminOnly>
              <PromptManagementPage />
            </AdminRoute>
          }
        />
        <Route path="data-points-management" element={<DataPointsManagementPage />} />
        <Route path="feature-flags" element={<FeatureFlagsPage />} />
        <Route 
          path="nav-coverage" 
          element={
            <AdminRoute superAdminOnly>
              <NavCoverageAuditPage />
            </AdminRoute>
          }
        />
        <Route 
          path="unused-components" 
          element={
            <AdminRoute>
              <UnusedComponentsPage />
            </AdminRoute>
          }
        />
        <Route 
          path="flows" 
          element={
            <AdminRoute superAdminOnly>
              <FlowManagementPage />
            </AdminRoute>
          }
        />
        <Route 
          path="system-optimization" 
          element={
            <AdminRoute superAdminOnly>
              <SystemOptimizationPage />
            </AdminRoute>
          }
        />
        <Route 
          path="debug-functions" 
          element={
            <AdminRoute superAdminOnly>
              <DebugFunctionsPage />
            </AdminRoute>
          }
        />
        <Route 
          path="vault-audit" 
          element={
            <AdminRoute superAdminOnly>
              <VaultAuditPage />
            </AdminRoute>
          }
        />
        {/* Legacy redirects */}
        <Route path="affiliate-links" element={<Navigate to="/admin/affiliate" replace />} />
        <Route path="affiliate-management" element={<Navigate to="/admin/affiliate" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;