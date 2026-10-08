# DIGIY SECURITY V29 — PULSE retirement: database trigger dependencies

**READ-ONLY CATALOG AUDIT — 2026-10-08.** No triggers have been disabled, no real
reservations or queues were read or changed, and the PULSE VPS stays stopped.

## Operator instruction (authoritative for this plan)

Historical PULSE/VPS loops resulted from a faulty connection. **Do not
reintroduce, reconnect or restart PULSE on Supabase or VPS.** The objective
is to isolate legacy database paths safely, not repair the faulty wiring.

## Founder clarification — legacy paths are obsolete, not part of today's reservations

The founder explicitly confirms that **the old PULSE no longer participates in the current reservation workflow** and that **NDIMBAL is also retired (CADUC)**. Neither must be restored, reconnected, or treated as an operational dependency of today's LOC reservations. The previous suggestion that preserving NDIMBAL was essential was incorrect.

The **database catalog still contains 8 enabled legacy PULSE-related triggers** attached to `public.digiy_loc_reservations` (six) and `public.reservations_loc` (two). Their `tgenabled='O'` setting only establishes that *if those underlying tables are written*, PostgreSQL would run them; **it does not establish that the modern reservation workflow uses those tables or triggers**. The metadata and the operator's live-workflow assessment are distinct. No trigger has been disabled in production.

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

**Three non-PULSE triggers must remain outside this narrowly scoped candidate** pending separate dependency verification: `trg_digiy_loc_reservation_to_pay` (historical payment-related trigger), `trg_res_set_owner` (owner assignment), and `trg_res_updated_at` (timestamp maintenance). They are database objects; this is not proof they are used by today's workflow.

`trg_ndimbal_after_paid` is a **separate obsolete NDIMBAL component** according to the founder. It is **not a mandatory preservation requirement** and its possible retirement belongs in a distinct, narrowly scoped review—not mixed into the eight-trigger PULSE change.

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
3. On **synthetic staging data**, verify whether writes to the two legacy tables
   still occur and demonstrate that current reservations, payment and owner
   access remain independent of all legacy PULSE/NDIMBAL components.
   Do **not** test or restore the stopped PULSE worker.
4. Only after separate approval, disable legacy PULSE triggers by their
   **exact names and tables**, never `DISABLE TRIGGER ALL`. Do not
   include the retired NDIMBAL trigger automatically: its separate,
   documented decommission can follow targeted analysis. Preserve
   non-targeted database objects, constraints, RLS and actual records;
   do not drop any table or function in the first rollout.
5. Read-only verify trigger statuses and remaining ACL exposure; evaluate
   whether to retire orphaned SQL EXECUTE grants and unused PULSE objects in
   a **separate** approved step. Preserve V26 TRUST fail-closed gate.

Stopping generation is **distinct** from protecting pre-existing public
SECURITY DEFINER RPCs: the V29 ACL candidates must be reviewed regardless
of trigger status.

## Do not deploy

This is a planning and safety artifact. Any SQL disable/enable action in
production, merge, or server restart requires its own explicit approval.
