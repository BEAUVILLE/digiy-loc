# DIGIY TRUST V24 — backend identity and least-privilege gate

## Live read-only findings (2026-10-08)
- Private feedback table: RLS enabled; 0 rows.
- `anon`, `authenticated`, `service_role`: no private schema USAGE.
- `service_role` can SELECT existing LOC Master unit records in `public`.
- A privileged `postgres` INSERT/ROLLBACK test succeeded in V23; this is **not** a server identity test.

## Blocking issue discovered
The current V17 storage adapter uses `INSERT ... RETURNING id`. PostgreSQL requires SELECT permissions and an appropriate RLS SELECT policy for RETURNING, so a naive INSERT-only role cannot execute it. Fix the adapter and its tests before provisioning the dedicated role; then test the actual SQL under the dedicated identity, not `postgres`.

## Deployment gates
1. Decide trusted server host and secrets management, plus credentials rotation and revocation plan.
2. Create a dedicated backend database role with only required privileges. Keep schema unexposed and public roles revoked.
3. Validate lookup of active LOC Master listing with the actual role; verify inactive IDs fail.
4. Test a rollback-only write under the actual role, including negative attempts to SELECT/UPDATE/DELETE private feedback.
5. Implement persistent atomic quotas and real bot verification; enforce streaming body limit before JSON parsing.
6. Confirm retention/deletion policy and review moderation workflow before public intake.

**No database GRANT, no credential creation, no public endpoint, and no client data changes in V24.** See `trust/sql/v24_server_role_review.sql` for the read-only gate.
