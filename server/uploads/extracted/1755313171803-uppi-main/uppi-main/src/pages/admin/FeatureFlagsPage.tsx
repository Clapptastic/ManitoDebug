import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';

const FeatureFlagsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Feature Flags | Platform Settings</title>
        <meta name="description" content="Manage feature flags, scopes, and rollout strategies in the admin panel." />
        <link rel="canonical" href="/admin/feature-flags" />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <p className="text-muted-foreground">Toggle features globally or by organization/user scope.</p>
      </header>

      <main>
        <section aria-label="Feature flag management">
          <FeatureFlagManager />
        </section>
      </main>
    </div>
  );
};

export default FeatureFlagsPage;
