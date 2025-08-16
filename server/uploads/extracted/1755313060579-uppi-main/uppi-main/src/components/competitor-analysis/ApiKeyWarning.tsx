import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, AlertTriangle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OutboundLink } from '@/components/shared/OutboundLink';
interface ApiKeyWarningProps {
  onDismiss?: () => void;
}

export const ApiKeyWarning: React.FC<ApiKeyWarningProps> = ({ onDismiss }) => {
  // Supported AI providers for competitor analysis. Any ONE is sufficient.
  const aiProviders = ['openai', 'anthropic', 'gemini', 'mistral', 'cohere', 'perplexity'];
  const label = (id: string) => ({
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google Gemini',
    mistral: 'Mistral',
    cohere: 'Cohere',
    perplexity: 'Perplexity'
  } as const)[id] ?? id;

  // Affiliate links integration: super admins can configure in /admin/affiliate.
  // We read active affiliate links and preferentially use them in help links.
const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>({});
const [providerLinks, setProviderLinks] = useState<Record<string, string>>({});
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
const linkKey = (id: string) => normalize(label(id));
const linkFor = (id: string, fallback: string) => providerLinks[id] || affiliateLinks[linkKey(id)] || fallback;

useEffect(() => {
  (async () => {
    // Fetch provider-based affiliate program links (preferred)
    type ProgramRow = { provider: string | null; affiliate_url: string | null; default_url: string | null; is_active: boolean | null; status?: string | null; program_name?: string | null };
    const { data: programs } = await supabase
      .from('affiliate_programs')
      .select('provider, affiliate_url, default_url, is_active, status, program_name')
      .or('is_active.eq.true,status.eq.active');

    const pMap: Record<string, string> = {};
    (programs || []).forEach((r: ProgramRow) => {
      const prov = (r.provider || '').toLowerCase();
      const url = r.affiliate_url || r.default_url || '';
      if (prov && url) pMap[prov] = url;
    });
    setProviderLinks(pMap);

    // Fallback: name-based affiliate links
    type LinkRow = { name: string; url: string; status?: string | null };
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('name,url,status')
      .eq('status', 'active');
    const map: Record<string, string> = {};
    (links || []).forEach((r: LinkRow) => {
      if (r?.name && r?.url) map[normalize(r.name)] = r.url;
    });
    setAffiliateLinks(map);
  })();
}, []);

  return (
    <Card className="border-warning" role="alert" aria-live="polite">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          🔑 AI Provider Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Connect at least one AI provider to unlock competitor analysis. Your API keys are encrypted and stored securely using Supabase Vault - only you can access them.
        </p>

        <div className="flex flex-wrap gap-2">
          {aiProviders.map((p) => (
            <Badge key={p} variant="secondary">{label(p)}</Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Set Up API Keys
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <OutboundLink href="https://docs.lovable.dev/user-guides/quickstart" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              API Key Guide
            </OutboundLink>
          </Button>
          {onDismiss && (
            <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔗 Quick Setup Links:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <OutboundLink href={linkFor('openai', 'https://platform.openai.com/api-keys')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get OpenAI API key</OutboundLink>
            </li>
            <li>
              <OutboundLink href={linkFor('anthropic', 'https://console.anthropic.com/')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get Anthropic key</OutboundLink>
            </li>
            <li>
              <OutboundLink href={linkFor('gemini', 'https://aistudio.google.com/app/apikey')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get Google AI Studio key</OutboundLink>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};