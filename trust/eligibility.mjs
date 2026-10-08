// DIGIY TRUST — pure eligibility rules. No database or network access.
// Server MUST independently authenticate actors, verify service evidence,
// issue/consume hashed one-time invitations atomically and enforce DB uniqueness.
export const COMMON_CRITERIA = Object.freeze(["reliability","quality","welcome","value_for_money"]);
export const EXTRA_CRITERIA = Object.freeze({
  loc: ["cleanliness","comfort"],
  resto: ["food_quality"],
  driver: ["driving_safety"],
});
export function eligibility({service, client, ownerId, now = new Date()}) {
  if (!service || !client) return {ok:false,reason:"missing_evidence"};
  if (service.status !== "completed" || !service.completedAt) return {ok:false,reason:"not_completed"};
  const completed = new Date(service.completedAt);
  if (!Number.isFinite(completed.getTime()) || completed > now) return {ok:false,reason:"invalid_completion"};
  if (service.cancelled || service.refundedAsNotDelivered) return {ok:false,reason:"not_delivered"};
  if (service.verifiedByServer !== true || service.independentEvidence !== true) return {ok:false,reason:"unverified_service"};
  if (client.verifiedByServer !== true || !client.id || client.id !== service.clientId) return {ok:false,reason:"unverified_client"};
  if (client.id === ownerId || client.id === service.professionalId) return {ok:false,reason:"self_review"};
  if (service.alreadyReviewed === true) return {ok:false,reason:"already_reviewed"};
  return {ok:true,reason:"eligible"};
}
export function validateRatings(module, ratings) {
  if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) return {ok:false,reason:"invalid_ratings"};
  const allowed = new Set([...COMMON_CRITERIA,...(EXTRA_CRITERIA[module]||[])]);
  const entries = Object.entries(ratings);
  if (entries.length === 0) return {ok:false,reason:"empty_ratings"};
  for (const [criterion,value] of entries) {
    if (!allowed.has(criterion)) return {ok:false,reason:"unknown_criterion"};
    if (!Number.isInteger(value) || value < 1 || value > 5) return {ok:false,reason:"invalid_star"};
  }
  return {ok:true,reason:"valid"};
}
