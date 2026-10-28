# DIGIY SECURITY V29 — P0 remediation gate

Status: **DRAFT / NOT DEPLOYABLE**. No SQL permissions changed. Do not merge as a remediation or activate TRUST based on this document.

## Verified database facts (read-only, 2026-10-08)

| Function | Owner | SECURITY DEFINER | EXECUTE grantees | search_path |
| --- | --- | --- | --- | --- |
| `public.digiy_loc_outbox_claim_due(integer,text)` | postgres | yes | PUBLIC, anon, authenticated, service_role, postgres | public |
| `public.digiy_pay_create_payment(text,integer,text,text,text,text,text,text,integer,text,jsonb)` | postgres | yes | PUBLIC, anon, authenticated, service_role, postgres | unset |

The outbox function returns `id, phone, reservation_id, room_id, pulse_kind, due_at, payload` and uses UPDATE/RETURN QUERY with SKIP LOCKED. The payment function returns JSONB and uses INSERT. Simple source-pattern checks found no auth/session/role/JWT references in either body. This is a **review signal, not a proven exploit**.

Three pg_cron jobs were present; none contained an exact textual reference to either function. GitHub text search also found no direct references; these negative searches do not rule out indirect or external consumers.

## Proposed minimum-change direction (not yet an executable migration)

1. **Outbox**: identify the real worker and its DB role. Move the claim operation behind a server-only boundary, preserving worker functionality. Revoke EXECUTE by **exact signature** from PUBLIC, anon and authenticated only after a verified alternative exists. Grant to the legitimate worker role only. Avoid assuming `p_worker` is an authentication mechanism.
2. **Payment**: first establish whether a public checkout legitimately invokes this RPC. Validate price/amount against server-side trusted data and authorization against the actual transaction. Do not simply revoke public access if checkout depends on it; introduce a validated server-side entrypoint first if required.
3. **search_path**: review all unqualified references and harden with a safe, explicitly pinned path before deploying the payment function. A pinned path alone is not an authorization control.
4. **TRUST V26**: preserve its fail-closed preflight. Even these two targeted fixes cannot resolve the remaining PUBLIC grants across hundreds of functions and extension relations.

## Mandatory verification before corrective SQL

- Read full function definitions and inspect all invoked functions, tables, triggers and authorization checks; do not publish secrets or private rows.
- Trace actual consumers across frontend, VPS workers, Supabase Edge Functions, cron, GitHub Actions and other repos; obtain role and expected input/output contract.
- On an ephemeral PostgreSQL 16/17 fixture, test legitimate worker/checkout success, anonymous/authenticated denial where appropriate, forged worker, invalid amount/reference, null/negative/extreme limit, concurrency and non-regression.
- Verify ACLs **after** changes: `has_function_privilege` for PUBLIC, anon, authenticated, service_role and the intended worker. Revoking PUBLIC alone is insufficient because anon/authenticated have explicit grants.
- Test existing LOC, RESTO, payment and TRUST suites; check the V26 fail-closed preflight independently.
- Only then open a **separate** executable SQL correction PR for explicit human approval. Git merge and database deployment require separate approvals.

## Stop conditions

If a legitimate consumer or auth boundary cannot be established, **do not deploy a guessed REVOKE or function rewrite**. Document the blocker and use an isolated environment for reproduction. Never execute mutating tests against production.

## Reference

V26: `trust/V26_SERVER_PERMISSIONS.md`; V27: `trust/V27_PUBLIC_PERMISSIONS_AUDIT.md`; V28 draft PR #34: `trust/V28_PRIORITY_PERMISSIONS_REVIEW.md`.

## Outbox family discovery (additional read-only audit)

A related function already implements a narrower ACL: `public.digiy_loc_outbox_claim(text,integer)` is SECURITY DEFINER, executable by `service_role` but **not** by `anon` or `authenticated`. This is a promising model to examine, **not** proof that the worker currently calls it.

Other related functions are still executable by `anon` and `authenticated`:

| Function | SECURITY DEFINER | anon/auth EXECUTE | Note |
| --- | --- | --- | --- |
| `digiy_loc_outbox_claim_due(integer,text)` | yes | yes | P0, sensitive returned fields |
| `digiy_loc_outbox_claim(text,integer)` | yes | no | service_role can execute |
| `digiy_loc_outbox_mark_sent(uuid)` | yes | yes | updates outbox state |
| `digiy_loc_outbox_mark_failed(uuid,text)` | yes | yes | updates outbox state |
| `claim_digiy_loc_pulse_outbox(text,integer)` | no | yes | separate function, review underlying RLS |

Text scans of the three SECURITY DEFINER siblings (`claim`, `mark_sent`, `mark_failed`) did not find `auth.uid`, `auth.role`, `current_setting` or `RAISE`; this is not a substitute for reviewing full definitions. **Do not secure only claim_due while leaving mark_sent/mark_failed unreviewed**. Expand P0's functional boundary to include the full claim/acknowledge/fail lifecycle, without automatically revoking any ACL.
