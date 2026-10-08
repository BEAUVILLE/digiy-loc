# DIGIY SECURITY V29 — PULSE retirement: database trigger dependencies

**READ-ONLY CATALOG AUDIT — 2026-10-08.** No triggers have been disabled, no real
reservations or queues were read or changed, and the PULSE VPS stays stopped.

## Operator instruction (authoritative for this plan)

Historical PULSE/VPS loops resulted from a faulty connection. **Do not
reintroduce, reconnect or restart PULSE on Supabase or VPS.** The objective
is to isolate legacy database paths safely, not repair the faulty wiring.

## Unexpected database-side behavior with VPS already stopped

The production database has **8 enabled PULSE-related triggers on two
reservation tables**. Six attach to `public.digiy_loc_reservations` and two
attach to `public.reservations_loc`; all have `tgenabled='O'`, meaning they
are enabled in normal/origin operation. **Stopping the VPS does not disable
them.** Trigger events can still create or alter queue records.

| Table | Trigger | When it fires | Queue target / purpose |
| --- | --- | --- | --- |
| digiy_loc_reservations | trg_digiy_loc_reservations_pulse_enqueue | INSERT or UPDATE status/payment_status | Delegate to `digiy_loc_pulse_enqueue_for_reservation`, which inserts into `digiy_loc_pulse_outbox` |
| digiy_loc_reservations | trg_loc_pulse_j1_16h | INSERT or UPDATE checkin | Writes/updates `digiy_loc_pulse_outbox` |
| digiy_loc_reservations | trg_loc_pulse_j_15h | INSERT or UPDATE checkin/room_id | Inserts `digiy_loc_pulse_outbox` |
| digiy_loc_reservations | trg_loc_pulses_ins | INSERT | Inserts `digiy_loc_outbox` via `digiy_loc_enqueue_standard_pulses` |
| digiy_loc_reservations | trg_loc_pulses_upd | UPDATE status to confirmed/paid | Inserts `digiy_loc_outbox` via `digiy_loc_enqueue_standard_pulses` |
| digiy_loc_reservations | trg_res_enqueue_pulse_j1 | INSERT | Inserts `digiy_loc_outbox` |
| reservations_loc | trg_digiy_loc_pulse_enqueue | INSERT or UPDATE, selected field changes | Delegate to `digiy_loc_pulse_enqueue_for_reservation` |
| reservations_loc | trg_digiy_loc_cancel_pulses | UPDATE status to canceled/rejected | Delegate to `digiy_loc_outbox_cancel_for_reservation` |

**Four other enabled triggers must remain untouched by any PULSE-only
proposal:** `trg_digiy_loc_reservation_to_pay` (payment flow),
`trg_ndimbal_after_paid`, `trg_res_set_owner` (ownership),
and `trg_res_updated_at` (timestamps).

There is also an enabled `trg_digiy_loc_pulse_outbox_updated_at` on
`digiy_loc_pulse_outbox` itself. It only manages row timestamps and is
**not** one of the eight reservation triggers to consider disabling.

The reviewed trigger functions and their immediate callees have **no
textual HTTP/network marker** and only local queue writes/delegation in
the inspected branches. This is an inventory, not full proof of every
indirect dependency. It is not evidence that an external worker still runs.

## Proposed non-destructive decommission sequence

1. Keep PULSE VPS stopped and disconnected; no new Supabase integration.
2. Confirm no active, legitimate consumer relies on notifications generated
   by these eight triggers; determine policy for already-queued messages,
   especially cancellation consistency. Use metadata/aggregate-only audits.
3. On **synthetic staging reservations**, compare insert, payment confirmation,
   status update, cancellation and room change *before and after* selectively
   disabling PULSE-only triggers; verify no breakage to reservations, payment,
   owner assignment, and NDIMBAL.
4. Only after separate approval, disable triggers by their **exact names
   and table**, never `DISABLE TRIGGER ALL`. Preserve the four unrelated
   enabled triggers, constraints, RLS, actual reservation records and
   queues. Do not drop functions/tables in the first rollout.
5. Read-only verify trigger statuses and remaining ACL exposure; evaluate
   whether to retire orphaned SQL EXECUTE grants and unused PULSE objects in
   a **separate** approved step. Preserve V26 TRUST fail-closed gate.

Stopping generation is **distinct** from protecting pre-existing public
SECURITY DEFINER RPCs: the V29 ACL candidates must be reviewed regardless
of trigger status.

## Do not deploy

This is a planning and safety artifact. Any SQL disable/enable action in
production, merge, or server restart requires its own explicit approval.
