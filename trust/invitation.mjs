// Server-only DIGIY TRUST invitation primitives. Do not bundle into a browser.
// Production storage must atomically consume an invitation with a UNIQUE
// (source_module, source_reservation_id) review constraint in PostgreSQL.
import {randomBytes, createHash, timingSafeEqual} from "node:crypto";
export const TOKEN_BYTES = 32;
export const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export function hashToken(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw new Error("invalid_token");
  return createHash("sha256").update(token,"utf8").digest("hex");
}
export function issueInvitation({verifiedEligibility, now=new Date(), ttlMs=DEFAULT_TTL_MS}) {
  if (verifiedEligibility?.ok !== true) throw new Error("not_eligible");
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || !Number.isSafeInteger(ttlMs) || ttlMs <= 0 || ttlMs > DEFAULT_TTL_MS) throw new Error("invalid_expiry");
  const token=randomBytes(TOKEN_BYTES).toString("hex");
  return {token, tokenHash:hashToken(token), expiresAt:new Date(now.getTime()+ttlMs).toISOString()};
}
export function verifyInvitation({token, storedHash, expiresAt, consumedAt, now=new Date()}) {
  if (consumedAt || !storedHash || typeof storedHash!=="string" || !/^[a-f0-9]{64}$/.test(storedHash)) return {ok:false,reason:"unavailable"};
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || !Number.isFinite(new Date(expiresAt).getTime()) || now >= new Date(expiresAt)) return {ok:false,reason:"expired"};
  let candidate;
  try { candidate=hashToken(token); } catch { return {ok:false,reason:"invalid_token"}; }
  const ok=timingSafeEqual(Buffer.from(candidate,"hex"),Buffer.from(storedHash,"hex"));
  return {ok,reason:ok?"valid":"invalid_token"};
}
