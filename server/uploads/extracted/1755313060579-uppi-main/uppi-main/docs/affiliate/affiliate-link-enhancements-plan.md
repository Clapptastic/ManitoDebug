# Affiliate Link System Enhancements (Post-Competitor Analysis)

Status: Planned (to begin after Competitor Analysis fixes are complete)
Owner: Platform Team
Last Updated: 2025-08-10

## Goals
- Automatically detect external links, prefer affiliate URLs when available, and capture suggestions for missing programs.
- Provide an admin workflow to review suggestions and create/update affiliate programs.
- Maintain per-user/org security, performance, and great UX.

## Scope
This plan complements the new affiliate_link_suggestions table and domain column on affiliate_programs and the shared OutboundLink component.

## 1) Types + Hooks
- Update types
  - Add `domain?: string | null` to AffiliateProgram type (src/types/admin.ts)
- Hook updates (src/hooks/admin/useAffiliateManagement.ts)
  - Select/insert/update `domain`
  - Continue using `.maybeSingle()` and remove manual `updated_at`

## 2) Admin UI for Suggestions
- Add a Suggestions tab/section in Affiliate Admin
  - List from `affiliate_link_suggestions` with filters (status, domain)
  - Actions: Mark reviewed/ignored, set `signup_url`, and “Create Program” prefilled from suggestion

## 3) Notifications
- Edge function or client flow to notify super admins on new suggestions
  - Insert `admin_audit_log` and optional notification badge/toast in admin

## 4) OutboundLink Adoption
- Replace external anchors across app with `OutboundLink`
  - Keep internal `Link` unchanged
  - Add in-memory session cache in `OutboundLink` to reduce repeated lookups

## 5) Data Quality & Matching
- Domain normalization helper (ensure hostname-only storage)
- One-time backfill of `affiliate_programs.domain` where missing (admin tool/edge)

## 6) Policies & Security
- Keep RLS as implemented for `affiliate_link_suggestions`
- Admin-only update/delete; user insert/select-own

## 7) Tests
- OutboundLink
  - Rewrites when active program exists
  - Logs suggestion when none exists
  - Cache prevents duplicate queries
- Admin Suggestions UI
  - Review, ignore, create program from suggestion
- Type checks: no `any`

## 8) Documentation
- Inline code comments for new components and hooks
- Short README note in docs/affiliate explaining the flow

## Acceptance Criteria
- External links preferentially use affiliate URLs when configured
- Missing programs are captured via suggestions
- Admins can manage suggestions and create programs
- All tests pass and RLS remains secure
