import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivacyPolicyManager } from '@/components/legal/PrivacyPolicyManager';
import { DataSubjectRequestForm } from '@/components/legal/DataSubjectRequestForm';
import { ComplianceDashboard } from '@/components/legal/ComplianceDashboard';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { Shield, FileText, Users, Cookie } from 'lucide-react';

export const LegalCompliancePage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Legal & Compliance</h1>
          <p className="text-muted-foreground">
            Manage GDPR compliance, privacy policies, and data subject rights
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Data Rights
          </TabsTrigger>
          <TabsTrigger value="cookies" className="flex items-center gap-2">
            <Cookie className="h-4 w-4" />
            Cookies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ComplianceDashboard />
        </TabsContent>

        <TabsContent value="policies">
          <PrivacyPolicyManager />
        </TabsContent>

        <TabsContent value="requests">
          <DataSubjectRequestForm />
        </TabsContent>

        <TabsContent value="cookies">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Cookie Management</h2>
              <p className="text-muted-foreground">
                Configure cookie consent and privacy preferences for your users.
              </p>
            </div>
            <CookieConsentBanner />
            <div className="text-center text-muted-foreground py-8">
              Cookie consent banner will appear for new users or when consent expires.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};