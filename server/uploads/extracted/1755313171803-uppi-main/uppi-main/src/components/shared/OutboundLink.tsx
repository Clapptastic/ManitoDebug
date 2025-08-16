import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/integrations/supabase/client';

// Session-scoped caches to reduce duplicate lookups and inserts
const affiliateDomainCache = new Map<string, string | null>(); // domain -> affiliate_url or null (none)
const suggestionLogged = new Set<string>(); // domain set to avoid duplicate suggestions per session

/**
 * OutboundLink
 * - Renders an external link
 * - Attempts to rewrite to an affiliate URL when an active program exists for the link's domain
 * - If no program is found, logs a suggestion to affiliate_link_suggestions for admin review
 *
 * Accessibility & SEO:
 * - Adds rel="noopener noreferrer" and target="_blank" by default for external links
 * - Preserves passed props and children
 */
export interface OutboundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  companyName?: string; // Optional hint for detected_program_name
}

export const OutboundLink: React.FC<OutboundLinkProps> = ({ href, companyName, children, target = '_blank', rel, ...rest }) => {
  const [finalHref, setFinalHref] = useState(href);

  const isExternal = useMemo(() => {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin !== window.location.origin;
    } catch {
      return false;
    }
  }, [href]);

  useEffect(() => {
    if (!isExternal) return; // Only process external links

    const run = async () => {
      try {
        const url = new URL(href);
        const rawHost = url.hostname.toLowerCase();
        const domain = rawHost.replace(/^www\./, '');

        // Check cache first
        if (affiliateDomainCache.has(domain)) {
          const cached = affiliateDomainCache.get(domain);
          if (cached) setFinalHref(cached);
          return; // if null, no program; skip network
        }

        // First, try exact domain match
        const { data: exact } = await supabase
          .from('affiliate_programs')
          .select('id, domain, affiliate_url, is_active, status, program_name, provider, default_url')
          .eq('domain', domain)
          .maybeSingle();

        let program = exact;

        // Fallback: look for default_url containing the domain if no exact domain record
        if (!program) {
          const { data: byUrl } = await supabase
            .from('affiliate_programs')
            .select('id, domain, affiliate_url, is_active, status, program_name, provider, default_url')
            .ilike('default_url', `%${domain}%`)
            .maybeSingle();
          program = byUrl ?? null;
        }

        // Always log outbound link for admin visibility (once per URL+status per session)
        const user = await getCurrentUser();
        if (user?.id) {
          const statusToLog = program && (program.is_active || program.status === 'active') ? 'reviewed' : 'new';
          const logKey = `${href}|${statusToLog}`;
          if (!suggestionLogged.has(logKey)) {
            suggestionLogged.add(logKey);
            await supabase.from('affiliate_link_suggestions').insert({
              domain,
              original_url: href,
              detected_program_name: companyName ?? program?.program_name ?? null,
              provider: program?.provider ?? null,
              signup_url: null,
              created_by: user.id,
              status: statusToLog,
            });
          }
        }

        // If an active program with an explicit affiliate_url exists, rewrite the link
        if (program && (program.is_active || program.status === 'active') && program.affiliate_url) {
          affiliateDomainCache.set(domain, program.affiliate_url);
          setFinalHref(program.affiliate_url);
          return;
        }

        // Cache the negative result to avoid repeated lookups
        affiliateDomainCache.set(domain, null);
      } catch (err) {
        // Silently ignore to avoid blocking navigation
        console.warn('OutboundLink processing failed:', err);
      }
    };

    run();
  }, [href, isExternal, companyName]);

  const computedRel = useMemo(() => {
    const base = rel ? `${rel}` : 'noopener noreferrer';
    return base;
  }, [rel]);

  // Render as a normal anchor with the computed finalHref
  return (
    <a href={finalHref} target={target} rel={computedRel} {...rest}>
      {children}
    </a>
  );
};

export default OutboundLink;
