'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

// Source-driven zero-dependency test. No live Supabase or WhatsApp calls.
const html = fs.readFileSync('fiche.html','utf8');
function extractFunction(name,params) {
  const start = '  function '+name+'('+params+'){';
  const i = html.indexOf(start);
  assert.ok(i >= 0,'Missing source function '+name);
  const end = html.indexOf('\n  }',i);
  assert.ok(end > i,'Incomplete source function '+name);
  return 'function '+name+'('+params+'){'+html.slice(i+start.length,end)+'\n}';
}
const opened=[];
const context = {
  TEAM_WA: '+221700000000',
  window: {open: (...args)=>opened.push(args)},
  safe: value=>String(value ?? '').trim(),
  digits: value=>String(value || '').replace(/\D/g,''),
  encodeURIComponent
};
vm.createContext(context);
vm.runInContext(
  extractFunction('getContact','room')+'\n'+extractFunction('openWa','phone, message'),
  context,{timeout:1000}
);
test('public RPC whatsapp_phone routes directly to owner',()=>{
  const room={slug:'synthetic',whatsapp_phone:'+221 77 123 45 67',call_phone:'+221 33 222 22 22'};
  const contact=context.getContact(room);
  assert.equal(contact,'+221771234567');
  opened.length=0;
  context.openWa(contact,'Demande synthétique');
  assert.equal(opened.length,1);
  const url=new URL(opened[0][0]);
  assert.equal(url.hostname,'wa.me');
  assert.equal(url.pathname,'/221771234567');
  assert.equal(url.searchParams.get('text'),'Demande synthétique');
  assert.equal(opened[0][2],'noopener,noreferrer');
});
test('the public RPC field takes precedence over other phone aliases',()=>{
  assert.equal(context.getContact({
    whatsapp_phone:'+221771234567',whatsapp:'+221700000001',owner_phone:'+221700000002'
  }),'+221771234567');
});
test('legacy direct contact aliases continue to work',()=>{
  assert.equal(context.getContact({whatsapp:'221 78 000 11 22'}),'+221780001122');
  assert.equal(context.getContact({owner_phone:'221 78 333 22 11'}),'+221783332211');
});
test('team fallback only when no owner WhatsApp is available',()=>{
  assert.equal(context.getContact({call_phone:'+221331234567'}),context.TEAM_WA);
  assert.equal(context.getContact({}),context.TEAM_WA);
});
test('rendered fiche buttons use the chosen contact; no in-app payment',()=>{
  assert.match(html,/CURRENT_CONTACT_WA\s*=\s*getContact\(room\)/);
  assert.match(html,/openWa\(CURRENT_CONTACT_WA,\s*buildDemandMessage\(CURRENT_ROOM\)\)/);
  assert.match(html,/DIGIY LOC · 0% commission · paiement direct/);
});
test('public room is fetched through the expected RPC',()=>{
  assert.match(html,/S\.rpc\("digiy_loc_public_room_by_slug",\s*\{\s*p_slug:\s*slug\s*\}\)/);
  assert.match(html,/room\.whatsapp_phone\s*\|\|/);
});
