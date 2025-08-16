# Database Migrations Documentation

This document tracks database schema changes performed via Supabase migrations for Competitor Analysis.

## 2025-08-11: Keep last 5 analysis runs per user/run type

- Migration ID: 20250811060239_e019a59b-ccf8-4ca5-a76a-b52d0a09b8f6
- Change: Added trigger `trg_cleanup_analysis_runs` on `public.analysis_runs` to retain only the 5 most recent runs per `(user_id, run_type)`.
- Trigger function: `public.cleanup_old_analysis_runs()` (pre-existing)
- Rationale: Limit historical rows to improve query performance and storage, while preserving recent drilldown/debug history.
- RLS & Security: No policy changes. The trigger executes server-side and deletes only older rows for the same `(user_id, run_type)` set after an insert.
- Impact: New inserts may remove the oldest entries beyond the most recent 5 for that user/run type. No change to current run behavior.
- Rollback: Drop trigger `trg_cleanup_analysis_runs` on `public.analysis_runs` if needed.

```sql
DROP TRIGGER IF EXISTS trg_cleanup_analysis_runs ON public.analysis_runs;
```

## Notes
- All timestamps remain database-managed; no manual timestamp setting was introduced.
- No reserved schemas were modified.

## 2025-08-12: Vault integration (safe, dynamic)
- Migration ID: 20250812190501_vault_dynamic_fallback
- Change: Added column public.api_keys.vault_secret_id and replaced public.manage_api_key to dynamically use Supabase Vault when available, with secure fallback to table storage when Vault is not installed. Uses dynamic EXECUTE to avoid compile-time dependency.
- RLS & Security: Preserved existing authorization checks (same user, super_admin, or service_role). No policy changes required.
- Impact: New inserts route secrets to Vault (api_keys.api_key set to NULL) once Vault is enabled in the project. Retrieval via operation 'get_for_decryption' returns plaintext from Vault or from api_keys.api_key if Vault is not present.
- Rollback: Restore previous manage_api_key definition and optionally drop vault_secret_id column (data loss warning if used).
