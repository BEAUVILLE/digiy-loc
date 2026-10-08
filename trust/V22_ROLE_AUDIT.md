# DIGIY TRUST V22 — privilege audit (2026-10-08)

Project: digiy-core. Audit was performed **read-only**, using `pg_roles` and `has_*_privilege`.

| Role | Schema USAGE | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- | --- |
| anon | no | no | no | no | no |
| authenticated | no | no | no | no | no |
| service_role | no | no | no | no | no |
| postgres | yes | yes | yes | yes | yes |

RLS is enabled; the table initially contains zero reviews. No public collection endpoint is active.

**Operational blocker:** The existing V17 `makePrivateFeedbackStorage(db)` adapter expects a privileged server-side PostgreSQL connection. It **cannot** currently write through a service_role-only connection. Do not grant public roles any rights to resolve this. Before connecting, decide whether to use a dedicated least-privilege server database role with narrowly scoped INSERT and active listing lookup, or an appropriately restricted service_role connection. Confirm connection pool credentials are server-only, enforce persistent atomic quotas and anti-bot, and validate negative access tests.

No SQL privileges were changed in V22. Do not infer an end-to-end insert from a passing GitHub CI run.
