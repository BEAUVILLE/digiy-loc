# DIGIY TRUST V23 — production DB transactional smoke test

Date: 2026-10-08. Project: digiy-core.

## Verified
- A privileged PostgreSQL session executed a real INSERT using an existing active LOC Master unit UUID.
- The INSERT was inside a transaction that was explicitly rolled back.
- A follow-up query returned `remaining_test_rows = 0`.
- No public endpoint was enabled, and no customer review was persisted.

Reproduce manually using `trust/sql/v23_rollback_insert_test.sql`; this is **not** an automated CI migration.

## Not yet verified
- A least-privilege server connection can INSERT (current `service_role` lacks private schema USAGE and table INSERT).
- Negative actual SELECT/INSERT requests under anon/authenticated connections, beyond privilege introspection.
- Atomic rate limits, bot challenge, bounded network ingress, retention and deletion, moderation and user consent UX.

## Decision
Do not grant `anon` or `authenticated` access. Do not embed privileged database credentials in GitHub Pages or any browser bundle. Before provisioning a dedicated backend database role, determine its credential lifecycle and hosting; do not commit secrets. The existing `makePrivateFeedbackStorage(db)` uses a server-side parameterized PostgreSQL adapter.

**State:** private DB works for a privileged rollback-only test; public intake remains disabled.
