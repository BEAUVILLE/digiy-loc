// DIGIY TRUST V2 — allowlist only; no attestation or DB writes.
export const MODULES = Object.freeze({
  loc: Object.freeze({criteria: Object.freeze(["cleanliness","comfort"])}),
  resto: Object.freeze({criteria: Object.freeze(["food_quality"])}),
  driver: Object.freeze({criteria: Object.freeze(["driving_safety"])}),
  explore: Object.freeze({criteria: Object.freeze([])}),
  build: Object.freeze({criteria: Object.freeze([])}),
  commerce: Object.freeze({criteria: Object.freeze([])}),
  jobs: Object.freeze({criteria: Object.freeze([])}),
  carnet: Object.freeze({criteria: Object.freeze([])}),
  bonne_affaire: Object.freeze({criteria: Object.freeze([])}),
  resa: Object.freeze({criteria: Object.freeze([])}),
});
export const COMMON_CRITERIA = Object.freeze(["reliability","quality","welcome","value_for_money"]);
export function moduleCriteria(module) {
  if (!Object.hasOwn(MODULES,module)) return null;
  return [...COMMON_CRITERIA,...MODULES[module].criteria];
}
// Explicitly disabled until an independently audited source-specific attestor exists.
export function moduleAttestationEnabled(_module) { return false; }
