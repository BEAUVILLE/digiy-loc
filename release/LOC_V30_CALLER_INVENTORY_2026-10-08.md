# DIGIY LOC V30 — caller inventory (source + server)

**Date:** 2026-10-08. **Mode:** source inspection and live Supabase catalog / Edge Function **read-only**. No production data mutation.

## Scope actually inspected

**99 named HTML/JS/TS/TSX files** in five confirmed GitHub repository default branches:

| Repository | Files screened | Observed MASTER client patterns |
|---|---:|---|
| `BEAUVILLE/digiy-loc` | 28/28 | No direct write to `digiy_loc_master_reservations` or `digiy_loc_master_unit_calendar` identified |
| `BEAUVILLE/part-chez-baptiste` | 5/5 | `gestion.html` writes through `digiy_loc_master_save_reservation_v1` and `digiy_loc_set_unit_calendar_state_v2`; calendar reads only. Owner UI V30 is a separate draft PR #12 |
| `BEAUVILLE/pro-espace` | 7/7 | `loc.html` writes through the same protected RPCs; calendar reads only. V30 draft PR #7 adds safe owner cancellation |
| `BEAUVILLE/digiy-master-modeles` | 49/49 | **One confirmed direct-write caller** at `LOC/MASTER-MAITRE-LOC/gestion.html`: table `.delete()` / `.upsert()`. Fixed in **draft PR #10**, with 7/7 isolated tests. Its public `index.html` and `MASTER-LOC-V1/index.html` read calendar only |
| `BEAUVILLE/digiylyfe.com` | 10 named LOC/calendar/gestion files (228 source files exist) | No matching MASTER direct writes in this targeted subset |

Matches were determined by source references to exact MASTER table/function names; absence of a match is **not** a proof that no aliases, dynamically generated SQL, other repositories, copies of the template, or deployed scripts exist.

### Edge Functions

- Connected `digiy-core` project reports **44** Edge Functions; six slugs plausibly relate to LOC or reservations: `reservation-lookup`, `reservation-cancel`, `digiy-loc-dossier`, `digiy-loc-owner-access`, `digiy-loc-admin`, `digiy-loc-magic-link`.
- The retrieved source payloads for these six did **not** contain exact references to `digiy_loc_master_unit_calendar`, `digiy_loc_master_reservations`, `digiy_loc_master_save_reservation_v1`, `digiy_loc_set_unit_calendar_state`, `digiy_loc_master_cancel_reservation_v1`.
- Therefore no directly matching MASTER writer was identified in those six; this is not a blanket proof that all deployed Edge Functions are harmless or that no indirect dependency exists.

### Server functions

- Postgres catalog source scan (`pg_get_functiondef`) for exact MASTER table names in user schemas returned **four existing functions**: `digiy_loc_master_save_reservation_v1`, `digiy_loc_master_list_reservations_v1`, `digiy_loc_set_unit_calendar_state`, `digiy_loc_set_unit_calendar_state_v2`.
- All are `SECURITY DEFINER` and owner RPCs are currently granted to `authenticated`; **legacy calendar v1 has `anon EXECUTE=true` at SQL grants level**, though its function body performs `auth.uid()` checks. Candidate V30 rewrites it to call the protected v2 implementation and revokes `anon` execution.
- Production tables have RLS enabled but authenticated currently has direct `INSERT/UPDATE/DELETE` privileges. Candidate V30 revokes those to prevent bypass.

## V30 MAÎTRE factory update (draft PR #10)

The MAÎTRE branch was extended beyond the calendar direct-write fix: a generic private reservation form and carnet, V30 owner cancellation and legacy v1 safe read fallback now belong to the repeatable template. The [15/15 Node tests](https://github.com/BEAUVILLE/digiy-master-modeles/actions/runs/37857692004) plus [4/4 mobile browser tests](https://github.com/BEAUVILLE/digiy-master-modeles/actions/runs/37857692007) cover this factory feature set. The new template is still only on a draft branch, **not** the `main` version described in the original 99-file scan. Real owner-session acceptance and a restored backup remain mandatory.

## Remaining release-only verification

1. Confirm deployed GitHub Pages and any alternate owner URLs actually serve only tracked template/client versions; inspect unknown archived repositories or copies separately.
2. Check backend jobs/automations outside the six inspected Edge Functions and any nonstandard direct SQL service credentials before revoking direct owner grants.
3. Prove successful **private restore** of a current, secured backup; the Free-tier project must not rely on unverified PITR.
4. Controlled smoke test with actual Saly/Sarlat owner sessions and authorized isolated test accommodation, checking v1 fallback, v2 cancellation, race rejection, cross-owner denial. Avoid real guest or live booking changes without owner authorization.
5. Keep [central PR #38](https://github.com/BEAUVILLE/digiy-loc/pull/38), [Saly #12](https://github.com/BEAUVILLE/part-chez-baptiste/pull/12), [Sarlat #7](https://github.com/BEAUVILLE/pro-espace/pull/7) and [MASTER model #10](https://github.com/BEAUVILLE/digiy-master-modeles/pull/10) as DRAFT until explicitly signed off.

## Conclusion

**No further confirmed direct MASTER calendar write in inspected source after the proposed PR #10 fix.** Source-level compatibility is encouraging, but **NO-GO** for production until restore evidence and acceptance of the actual deployed stack. See [release gate](LOC_V30_RELEASE_GATE_2026-10-08.md).
