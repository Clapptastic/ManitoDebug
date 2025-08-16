import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/services/featureFlagService';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * FeatureFlagGate
 * Reusable gate component to protect routes/pages behind feature flags.
 * - Uses get_effective_feature_flag RPC (via hook) honoring user/org/global scopes
 * - Shows a friendly message with a Settings shortcut when disabled
 */
interface FeatureFlagGateProps {
  flag: keyof typeof FEATURE_FLAGS;
  children: React.ReactNode;
}

const FeatureFlagGate: React.FC<FeatureFlagGateProps> = ({ flag, children }) => {
  const { isEnabled, loading, error } = useFeatureFlag(FEATURE_FLAGS[flag]);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <div className="h-4 w-4 rounded-full border border-border animate-spin" aria-hidden />
        <span>Checking access…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Unable to verify feature access: {error}</span>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="p-8 border rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold">This feature is currently disabled</h2>
            <p className="text-muted-foreground mt-1">
              An admin can enable it in Settings → Feature Flags. Access is controlled per user/org/global scope.
            </p>
            <div className="mt-4">
              <Link to="/settings" className="underline">Go to Settings</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default FeatureFlagGate;
