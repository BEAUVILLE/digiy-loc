# DIGIY TRUST V19 — readiness audit

## Verified on 2026-10-08
- Supabase project digiy-core: private schema `digiy_trust_private` does **not** exist. No migration has been applied by this change.
- V18 pilot code is disabled by default, has no public endpoint, and uses injected anti-bot/quota callbacks.
- V17 SQL is review-only and replaces V14 draft; do not run both.

## Required before real intake
1. Approve retention period, moderation access, and deletion workflow for voluntary feedback.
2. Deploy and verify V17 private schema in a controlled migration, after security review.
3. Validate service-only database role and deny `anon`, `authenticated`, and owner read/write. Confirm private schema not in exposed PostgREST schemas.
4. Implement and integration-test real server-side anti-bot verification and persistent atomic quota enforcement.
5. Implement a hardened HTTPS handler with raw byte limits, origin policy, no sensitive logs, and controlled secrets.
6. End-to-end staging test: active unit accepted, inactive/unknown rejected, repeat/spam blocked, data private, no public publication or verified-stay claims.
7. Pilot one explicitly chosen LOC property only after all security gates pass.

## Operational rule
A green CI pipeline for pure functions does not imply deployed, secure public collection. Never set enabled=true in production until all above are independently verified.
