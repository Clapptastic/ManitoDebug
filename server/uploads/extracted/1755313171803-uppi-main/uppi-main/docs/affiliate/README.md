# Affiliate Links: OutboundLink Usage & Admin Notifications

Status: Implemented
Last Updated: 2025-08-10

Overview
- OutboundLink component rewrites external URLs to configured affiliate URLs when available, and logs suggestions when none exist.
- Admins receive realtime notifications for new suggestions via a badge and toast in Affiliate Admin.

Usage
- Replace external anchors with OutboundLink:

```tsx
import { OutboundLink } from '@/components/shared/OutboundLink';

<Button asChild>
  <OutboundLink href="https://vendor.com/docs">Docs</OutboundLink>
</Button>
```

How It Works
- Normalizes hostname (removes www) and checks affiliate_programs by domain.
- If active program with affiliate_url is found, href is rewritten.
- Otherwise, inserts a row into affiliate_link_suggestions once per domain per session.

Admin Notifications
- Hook: useAffiliateSuggestionsRealtime subscribes to INSERT events on affiliate_link_suggestions.
- Affiliate Admin shows a badge with the number of new suggestions and toasts on arrival.

Security & RLS
- Inserts into affiliate_link_suggestions are client-side; ensure RLS permits user inserts and admin selects.
- Admin pages should remain behind admin auth.

Testing
- Unit tests: src/components/shared/__tests__/OutboundLink.test.tsx
  - Rewrites when program exists
  - Logs suggestions when none exists

Notes
- Prefer provider-based links configured in affiliate_programs.
- Keep UI accessible; OutboundLink preserves rel="noopener noreferrer" and target defaults.
