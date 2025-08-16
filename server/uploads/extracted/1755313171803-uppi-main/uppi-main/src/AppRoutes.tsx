import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layouts/AppLayout';
import AdminRoutes from '@/routes/AdminRoutes';
import FeatureFlagGate from '@/components/access/FeatureFlagGate';

// Pages
import Dashboard from '@/pages/Dashboard';
import { MarketResearchDashboard } from '@/components/market-research/MarketResearchDashboard';
import CompanyProfilePage from '@/pages/CompanyProfilePage';
import ProfilePage from '@/pages/ProfilePage';
import SavedAnalysesPage from '@/pages/SavedAnalysesPage';
import ApiKeysPage from '@/pages/ApiKeysPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ChatPage from '@/pages/ChatPage';
import DocumentStorage from '@/pages/DocumentStorage';
import { MarketResearchPage } from '@/pages/MarketResearchPage';
import MarketSizeAnalysisPage from '@/pages/market-research/MarketSizeAnalysisPage';
import CustomerSurveysPage from '@/pages/market-research/CustomerSurveysPage';
import TrendAnalysisPage from '@/pages/market-research/TrendAnalysisPage';
import { BusinessPlanPage } from '@/pages/BusinessPlanPage';
import ResourcesPage from '@/pages/ResourcesPage';
import MarketValidationPage from '@/pages/market-validation/MarketValidationPage';
import MarketAnalysisPage from '@/pages/market-analysis/MarketAnalysisPage';
import SavedMarketAnalysesPage from '@/pages/market-analysis/SavedMarketAnalysesPage';
import DebugPage from '@/pages/DebugPage';
import AuthCallback from '@/pages/AuthCallback';
// PromptManagementPage is routed under AdminRoutes
import AuthRoutes from '@/routes/AuthRoutes';
import { BusinessToolsDashboard } from '@/components/dashboard/BusinessToolsDashboard';

import { MVPBuilderDashboard } from '@/components/mvp/MVPBuilderDashboard';
import UnifiedCompetitorAnalysisPage from '@/pages/UnifiedCompetitorAnalysisPage';
import AnalysisDetailPage from '@/pages/AnalysisDetailPage';
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard';
import { LegalCompliancePage } from '@/pages/legal/LegalCompliancePage';
import { BillingPage } from '@/pages/billing/BillingPage';
import TeamsPage from '@/pages/teams/TeamsPage';
import CreateTeamPage from '@/pages/teams/CreateTeamPage';
import TeamWorkspacePage from '@/pages/teams/TeamWorkspacePage';
import TeamSettingsPage from '@/pages/teams/TeamSettingsPage';
import SupportPage from '@/pages/support/SupportPage';
import CreateTicketPage from '@/pages/support/CreateTicketPage';
import TicketDetailPage from '@/pages/support/TicketDetailPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="company-profile" element={<CompanyProfilePage />} />
        <Route path="chat" element={<ChatPage />} />
        
        {/* Market Research Routes */}
        <Route path="market-research">
          <Route index element={<MarketResearchPage />} />
          <Route path="dashboard" element={<MarketResearchDashboard />} />
          <Route path="competitor-analysis" element={<UnifiedCompetitorAnalysisPage />} />
          <Route path="competitor-analysis/details/:analysisId" element={<AnalysisDetailPage />} />
          <Route path="saved-analyses" element={<SavedAnalysesPage />} />
          <Route path="market-size" element={
            <FeatureFlagGate flag="MARKET_RESEARCH_MARKET_SIZE">
              <MarketSizeAnalysisPage />
            </FeatureFlagGate>
          } />
          <Route path="customer-surveys" element={
            <FeatureFlagGate flag="MARKET_RESEARCH_CUSTOMER_SURVEYS">
              <CustomerSurveysPage />
            </FeatureFlagGate>
          } />
          <Route path="trend-analysis" element={<TrendAnalysisPage />} />
        </Route>
        
        {/* Market Analysis */}
        <Route path="market-analysis/:id" element={<MarketAnalysisPage />} />
        <Route path="saved-market-analyses" element={<SavedMarketAnalysesPage />} />
        
        {/* Legacy redirects for backward compatibility */}
        <Route path="competitor-analysis" element={<Navigate to="/market-research/competitor-analysis" replace />} />
        <Route path="market-validation">
          <Route index element={<MarketValidationPage />} />
          <Route path="competitor-analysis" element={<Navigate to="/market-research/competitor-analysis" replace />} />
        </Route>
        
        {/* Other Core Pages */}
        <Route path="business-plan" element={
          <FeatureFlagGate flag="BUSINESS_PLAN">
            <BusinessPlanPage />
          </FeatureFlagGate>
        } />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="documents" element={<DocumentStorage />} />
        
        {/* Business Tools & Analytics */}
        <Route path="business-tools" element={<BusinessToolsDashboard />} />
        <Route path="mvp-builder" element={<MVPBuilderDashboard />} />
        <Route path="analytics" element={<AdvancedAnalyticsDashboard />} />
        <Route path="legal-compliance" element={<LegalCompliancePage />} />
        <Route path="billing" element={<BillingPage />} />
        
        {/* Team Collaboration */}
        <Route path="teams">
          <Route index element={
            <FeatureFlagGate flag="TEAMS">
              <TeamsPage />
            </FeatureFlagGate>
          } />
          <Route path="create" element={
            <FeatureFlagGate flag="TEAMS">
              <CreateTeamPage />
            </FeatureFlagGate>
          } />
          <Route path=":teamId/workspace" element={
            <FeatureFlagGate flag="TEAMS">
              <TeamWorkspacePage />
            </FeatureFlagGate>
          } />
          <Route path=":teamId/settings" element={
            <FeatureFlagGate flag="TEAMS">
              <TeamSettingsPage />
            </FeatureFlagGate>
          } />
        </Route>
        
        {/* Customer Support */}
        <Route path="support">
          <Route index element={<SupportPage />} />
          <Route path="create" element={<CreateTicketPage />} />
          <Route path="ticket/:ticketId" element={<TicketDetailPage />} />
        </Route>
        
        {/* Settings & API Management - Single Route */}
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/api-keys" element={<Navigate to="/api-keys" replace />} />
        
        <Route path="debug" element={<DebugPage />} />
      </Route>
      
      {/* Authentication routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      
      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* OAuth callback route */}
      <Route path="/redirect" element={<AuthCallback />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
