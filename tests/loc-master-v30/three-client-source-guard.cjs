#!/usr/bin/env node
'use strict';

// Fail-closed source-contract guard for three PINNED V30 owner candidates.
// This static check complements isolated SQL/browser tests, but cannot prove
// the absence of unknown deployed aliases, generated JS or external writers.
const fs=require('node:fs');

const calendar='digiy_loc_master_unit_calendar';
const sites=[
  ['Saly','staging/saly/gestion.html',2],
  ['Sarlat','staging/sarlat/loc.html',3],
  ['MAITRE','staging/maitre/LOC/MASTER-MAITRE-LOC/gestion.html',2],
];
const requiredRpc=[
  'digiy_loc_set_unit_calendar_state_v2',
  'digiy_loc_master_save_reservation_v1',
  'digiy_loc_master_list_reservations_v2',
  'digiy_loc_master_cancel_reservation_v1',
];
const writeOps=/\.\s*(?:insert|upsert|update|delete)\s*\(/i;
const fromRe=/\.from\s*\(\s*(['"])digiy_loc_master_unit_calendar\1\s*\)/g;
const firstReadMethod=/^\s*(?:\/\*[\s\S]*?\*\/\s*)*\.select\s*\(/;

function validateSource(label,html,expectedHits){
  const errors=[];
  const instances=[...html.matchAll(fromRe)];
  const occurrences=html.split(calendar).length-1;
  if(instances.length!==expectedHits || occurrences!==expectedHits){
    errors.push('V30_CALENDAR_CALLSITE_COUNT_DRIFT: '+label);
  }
  for(const hit of instances){
    const after=html.slice(hit.index+hit[0].length);
    // A query is accepted only if it starts by SELECT without assignment,
    // alias or a mutation first. Never treat an alias as proof of read-only.
    if(!firstReadMethod.test(after)){
      errors.push('V30_UNVERIFIED_CALENDAR_TABLE_USAGE: '+label);
    }
    // A writable operation chained on the same JS statement is forbidden.
    // Conservatively bound the scan, failing closed if statement is complex.
    const end=after.indexOf(';');
    if(end<0 || end>10000){
      errors.push('V30_CALENDAR_QUERY_UNPARSABLE: '+label);
      continue;
    }
    const statement=after.slice(0,end);
    if(writeOps.test(statement)){
      errors.push('V30_UNGUARDED_DIRECT_CALENDAR_WRITE: '+label);
    }
  }
  for(const rpc of requiredRpc){
    if(!html.includes(rpc)){
      errors.push('V30_REQUIRED_RPC_MISSING: '+label+' '+rpc);
    }
  }
  return {ok:errors.length===0,errors,hits:instances.length};
}

function main(){
  let pass=true;
  for(const [label,file,expectedHits] of sites){
    if(!fs.existsSync(file)){
      console.error('V30_SOURCE_MISSING: '+label+' (pinned candidate unavailable)');
      pass=false;
      continue;
    }
    const result=validateSource(label,fs.readFileSync(file,'utf8'),expectedHits);
    if(!result.ok){
      result.errors.forEach(error=>console.error(error));
      pass=false;
    }else{
      console.log('V30_PINNED_CANDIDATE_CONTRACT_OK: '+label+' ('+result.hits+' verified SELECT sites)');
    }
  }
  if(!pass) process.exitCode=1;
  else console.log('V30_THREE_CLIENT_GUARD_OK: Saly + Sarlat + MAITRE, pinned source only; production untouched.');
}

if(require.main===module) main();
module.exports={validateSource};
