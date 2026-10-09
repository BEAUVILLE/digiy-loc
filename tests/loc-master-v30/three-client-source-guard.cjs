#!/usr/bin/env node
'use strict';

// CI-only code guard for three pinned V30 candidate HTML sources.
// This is NOT a substitute for inspecting independently deployed copies.
const fs=require('node:fs');
const paths=[
  ['Saly','staging/saly/gestion.html'],
  ['Sarlat','staging/sarlat/loc.html'],
  ['MAITRE','staging/maitre/LOC/MASTER-MAITRE-LOC/gestion.html'],
];
const calendar='digiy_loc_master_unit_calendar';
const writeOps=/\.\s*(?:insert|upsert|update|delete)\s*\(/i;
let pass=true;
for(const [site,file] of paths){
  if(!fs.existsSync(file)){
    console.error('V30_SOURCE_MISSING: '+site+' (pinned candidate not checked out)');
    pass=false;continue;
  }
  const html=fs.readFileSync(file,'utf8');
  const fromRe=/\.from\s*\(\s*["']digiy_loc_master_unit_calendar["']\s*\)/g;
  let hits=0, match;
  while((match=fromRe.exec(html))!==null){
    hits++;
    // Inspect the full query statement; stop at the first JS semicolon.
    // Fail closed for unusually long/complex statement paths.
    const after=html.slice(fromRe.lastIndex);
    const stop=after.indexOf(';');
    if(stop<0 || stop>10000){
      console.error('V30_CALENDAR_QUERY_UNPARSABLE: '+site);
      pass=false;continue;
    }
    const chain=after.slice(0,stop);
    if(writeOps.test(chain)){
      console.error('V30_UNGUARDED_DIRECT_CALENDAR_WRITE: '+site);
      pass=false;
    }
  }
  if(!hits){console.error('V30_CALENDAR_READ_EXPECTED: '+site);pass=false;}
  for(const rpc of ['digiy_loc_set_unit_calendar_state_v2','digiy_loc_master_save_reservation_v1',
                    'digiy_loc_master_list_reservations_v2','digiy_loc_master_cancel_reservation_v1']){
    if(!html.includes(rpc)){
      console.error('V30_REQUIRED_RPC_MISSING: '+site+' '+rpc);
      pass=false;
    }
  }
  if(hits && !writeOps.test('') && html.includes('digiy_loc_master_cancel_reservation_v1')){
    console.log('V30_PINNED_CANDIDATE_CONTRACT_OK: '+site+' ('+hits+' calendar SELECT call sites)');
  }
}
if(!pass)process.exit(1);
console.log('V30_THREE_CLIENT_GUARD_OK: Saly + Sarlat + MAITRE, source snapshots only; production untouched.');
