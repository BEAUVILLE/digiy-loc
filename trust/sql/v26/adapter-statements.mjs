// Emit the real adapter SQL for PostgreSQL PREPARE/EXECUTE integration tests.
// No database connection, secret, dependency or replacement adapter implementation.
import assert from 'node:assert/strict';
import {makePrivateFeedbackStorage} from '../../supabase-storage-adapter.mjs';
const queries = [];
const storage = makePrivateFeedbackStorage({query: async (sql, values) => {
  queries.push({sql, values});
  return {rows: [{one: 1}], rowCount: 1};
}});
const id = '00000000-0000-4000-8000-000000000001';
await storage.lookupActiveListing(id);
await storage.storePrivate({listing_id: id, overall_rating: 5, cleanliness: null,
  comfort: null, welcome: null, comment: '', declared_stay: true,
  publication_consent: false, moderation_status: 'received', stay_verified: false});
assert.equal(queries.length, 2);
assert.equal(queries[0].values.length, 1);
assert.equal(queries[1].values.length, 7);
console.log(`prepare trust_lookup(uuid) as ${queries[0].sql};`);
console.log(`prepare trust_insert(uuid,smallint,smallint,smallint,smallint,text,boolean) as ${queries[1].sql};`);
