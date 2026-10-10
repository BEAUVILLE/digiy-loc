# DIGIY SECURITY V29 — LOC PULSE family: expanded P0 review

**Status: READ-ONLY FINDINGS / NOT A PRODUCTION EXPLOIT TEST.**
Date: 2026-10-08. Supabase project: digiy-core.

## Why the existing 3-function candidate is insufficient as a full LOC security fix

The narrow V29 candidate covers only `public.digiy_loc_outbox_claim_due(integer,text)`,
`public.digiy_loc_outbox_mark_sent(uuid)`, and
`public.digiy_loc_outbox_mark_failed(uuid,text)` against table `public.digiy_loc_outbox`.

Another table and worker family exists: `public.digiy_loc_pulse_outbox`.
Both outbox tables have RLS enabled. On both, `anon` and `authenticated`
currently lack direct SELECT, UPDATE and INSERT privileges; `service_role`
has those privileges. **Those RLS/table grants do not authorize trusting a
SECURITY DEFINER function**, which executes as its owner (postgres here).

## Catalog inventory (read-only)

All 15 signatures below show effective EXECUTE for `anon`,
`authenticated` and `service_role`. The trigger-returning
functions cannot be invoked as ordinary RPCs. For SECURITY INVOKER functions,
EXECUTE alone does not override underlying table privileges or RLS.

| Function | Args (identity) | Definer? | Classification for review |
| --- | --- | --- | --- |
| `digiy_loc_pulse_claim_batch` | `integer` | YES | P0 worker claim; returns entire pulse_outbox row |
| `digiy_loc_pulse_claim_batch` | `integer,timestamptz,text` | YES | P0 worker claim; returns entire pulse_outbox row |
| `digiy_loc_pulse_mark_sent` | `uuid` | YES | P0 worker acknowledgement |
| `digiy_loc_pulse_mark_sent` | `uuid,text,text,text` | YES | P0 worker acknowledgement |
| `digiy_loc_pulse_fail_backoff` | `uuid,text,text,text` | YES | P0 worker retry/error update |
| `digiy_loc_pulse_retry` | `uuid,text,integer` | YES | P0/P1 worker retry: confirm consumer first |
| `digiy_loc_pulse_enqueue` | `uuid,text,text,date,date,text,text,uuid` | YES | P1 booking enqueue; public use must be determined |
| `digiy_loc_pulse_enqueue_for_reservation` | `uuid` | YES | P1 booking enqueue; public use must be determined |
| `digiy_loc_pulse_generate` | `date` | YES | P1 scheduler; map actual caller |
| `digiy_loc_pulse_mark_seen` | `uuid` | YES | P1 owner-visible read status; trace UI |
| `digiy_loc_pulse_ack` | `uuid` | NO | Invoker; check table privilege/RLS and callee |
| `claim_digiy_loc_pulse_outbox` | `text,integer` | NO | Invoker; check table privilege/RLS and callee |
| `digiy_loc_pulse_enqueue_j1_16h` | `(none)` | YES | trigger, not ordinary RPC |
| `digiy_loc_pulse_j_15h` | `(none)` | YES | trigger, not ordinary RPC |
| `digiy_loc_pulse_j1_16h` | `(none)` | NO | trigger, not ordinary RPC |

The two `digiy_loc_pulse_claim_batch` variants have **explicit**
`PUBLIC`, `anon`, `authenticated`, `postgres`, and
`service_role` EXECUTE ACL entries. Therefore `REVOKE FROM PUBLIC` alone
would not block callers with explicit grants.

The `integer,timestamptz,text` claim variant mentions `UPDATE`,
`RETURN QUERY` and the outbox table in its body; boolean text probes
found no `auth.uid`, `auth.role`, `current_setting`, or `RAISE`.
Subsequent **full-body** review establishes that the `integer` variant
uses `current_setting('app.worker_id', true)` only as a worker label,
**not** as an authorization gate; neither overload authenticates the
caller in its body. See `trust/V29_FULL_BODY_AUTHORIZATION_FINDINGS.md`.
The actual API and network exposure remains a separate verification step.

The pulse table contains sensitive/operational columns including
`phone`, `message`, `payload`, `owner_id`, `reservation_id`,
`status`, `locked_by`, and delivery metadata. A successful unauthorized
SECURITY DEFINER claim could therefore disclose information or change
queue state.

## Evidence from a legacy worker — not proof of active usage

`BEAUVILLE/pro-loc/ARCHIVE/ANCIENNE_MECANIQUE_PRO_2026-08-25/worker.mjs`
creates a Supabase client using `SUPABASE_SERVICE_ROLE_KEY` on a server.
It calls `digiy_loc_pulse_claim_batch` with `p_limit`, then calls
`digiy_loc_pulse_ack` with `p_id`, `p_ok`, `p_provider_result`, and
`p_error`. The *current* DB catalog instead shows
`digiy_loc_pulse_ack(p_outbox_id uuid)` and no matching 4-parameter ACK
overload. This is evidence of **contract drift**; the archived worker
cannot be used to certify current production behavior.

GitHub code-search indexing returned false negatives even on known files;
a zero-hit search does not establish that a function is unused. PostgreSQL
`track_functions` is `none`, so its statistics also cannot prove non-use.
The VPS and other external consumers have **not** been inspected.

## Decisions / release gates

1. Keep the existing 3-function ACL candidate as a distinct, draft-only proposal.
2. Review both `digiy_loc_pulse_claim_batch` overloads first; these are
   plausible worker-only candidates but must be checked for active callers,
   indirect auth, bounds, queue ownership, concurrency and API exposure.
3. Next review `mark_sent` (both overloads), `fail_backoff` and
   `retry` together. A claim-only lock-down does not close the whole
   worker lifecycle.
4. **Do not revoke** booking enqueue, owner mark-seen, invoker or trigger
   function rights by association: validate each entrypoint separately.
5. On **disposable PostgreSQL 16/17 only**: regression-test worker claim,
   acknowledgements, retries, forged callers, empty queue, overlap,
   concurrent workers, output privacy and rollback. Keep public booking
   and owner flows functional.
6. Nothing here authorizes SQL changes on production or bypassing the
   V26 TRUST fail-closed preflight. Merge, deployment and TRUST activation
   are independent release decisions.

Source: PostgreSQL read-only catalog/ACL/RLS inspection, legacy GitHub
worker, and Supabase documentation for SECURITY DEFINER and EXECUTE ACLs.
