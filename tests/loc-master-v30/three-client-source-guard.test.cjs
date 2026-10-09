#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validateSource}=require('./three-client-source-guard.cjs');

const rpc=[
  'digiy_loc_set_unit_calendar_state_v2',
  'digiy_loc_master_save_reservation_v1',
  'digiy_loc_master_list_reservations_v2',
  'digiy_loc_master_cancel_reservation_v1'
].map(s=>"const rpc='"+s+"';").join('\n');

const src=(query)=>rpc+'\nconst db={};\n'+query+'\n';

test('accept exactly one read-only calendar query and all owner RPC references',()=>{
  const html=src("await db.from('digiy_loc_master_unit_calendar').select('day,status').eq('unit_id',unitId);");
  assert.deepEqual(validateSource('fixture',html,1),{ok:true,errors:[],hits:1});
});

const denyCases=[
  ['simple direct DELETE',"db.from('digiy_loc_master_unit_calendar').delete().eq('unit_id',unitId);"],
  ['direct UPSERT',"db.from('digiy_loc_master_unit_calendar').upsert(rows);"],
  ['direct UPDATE',"db.from('digiy_loc_master_unit_calendar').update({status:'available'});"],
  ['direct INSERT',"db.from('digiy_loc_master_unit_calendar').insert(rows);"],
  ['chained SELECT followed by UPDATE',"db.from('digiy_loc_master_unit_calendar').select('*').update({status:'closed'});"],
  ['aliased direct DELETE',"const calendarQuery=db.from('digiy_loc_master_unit_calendar'); calendarQuery.delete();"],
  ['aliased SELECT',"const calendarQuery=db.from('digiy_loc_master_unit_calendar'); calendarQuery.select('day');"],
  ['multiline alias',"const calendarQuery=db.from(\n \"digiy_loc_master_unit_calendar\"\n );\n calendarQuery.delete();"],
];
for(const [description,query] of denyCases){
  test('reject '+description,()=>{
    const r=validateSource('fixture',src(query),1);
    assert.equal(r.ok,false,JSON.stringify(r));
    assert.ok(r.errors.some(e=>/UNVERIFIED|WRITE/.test(e)));
  });
}

test('reject a dynamically-selected calendar table not proven read-only',()=>{
  const html=src("const CALENDAR='digiy_loc_master_unit_calendar'; db.from(CALENDAR).delete();");
  const r=validateSource('fixture',html,1);
  assert.equal(r.ok,false);
  assert.ok(r.errors.some(e=>e.includes('CALLSITE_COUNT_DRIFT')));
});

test('reject an extra calendar table occurrence (uninspected new source code)',()=>{
  const html=src("db.from('digiy_loc_master_unit_calendar').select('day'); const name='digiy_loc_master_unit_calendar';");
  const r=validateSource('fixture',html,1);
  assert.equal(r.ok,false);
  assert.ok(r.errors.some(e=>e.includes('CALLSITE_COUNT_DRIFT')));
});

test('reject removal of owner cancellation RPC contract',()=>{
  const html=src("db.from('digiy_loc_master_unit_calendar').select('day');")
    .replace('digiy_loc_master_cancel_reservation_v1','missing_cancel_rpc');
  const r=validateSource('fixture',html,1);
  assert.equal(r.ok,false);
  assert.ok(r.errors.some(e=>e.includes('REQUIRED_RPC_MISSING')));
});

test('reject more calendar call sites than expected',()=>{
  const html=src("db.from('digiy_loc_master_unit_calendar').select('day'); db.from('digiy_loc_master_unit_calendar').select('status');");
  assert.equal(validateSource('fixture',html,1).ok,false);
});

test('allow multiline read-only SELECT with quoted field names',()=>{
  const html=src("await db.from(\n \"digiy_loc_master_unit_calendar\"\n )\n .select('day,status')\n .eq('unit_id',unitId);");
  assert.equal(validateSource('fixture',html,1).ok,true);
});
