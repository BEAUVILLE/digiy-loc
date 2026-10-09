'use strict';
const {test,expect}=require('@playwright/test');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const cases=[
  {name:'Saly owner dedicated card',html:'staging/saly/gestion.html',params:'mode=',unit:'saly-chez-baptiste'},
  {name:'Sarlat owner module',html:'staging/sarlat/loc.html',params:'site=sarlat-chez-baptiste&mode=',unit:'sarlat-chez-baptiste'}
];
const file=(p,q)=>pathToFileURL(path.resolve(p)).href+'?'+q;

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    window.__calls=[];window.__outbound=[];window.__confirmations=0;
    window.confirm=()=>{window.__confirmations++;return true;};
    window.open=(...args)=>{window.__outbound.push(args);return null;};
    window.fetch=async()=>{throw Error('NO LIVE API OR PAYMENT PERMITTED');};
    const booking={
      id:'00000000-0000-4000-8000-000000000a90',
      unit_id:'00000000-0000-4000-8000-000000000a02',
      guest_name:'Client fictif de test',guest_phone:'000-TEST',
      start_day:'2026-12-20',end_day:'2026-12-22',
      note:'Fixture only',source:'direct',status:'active',
      cancelled_at:null
    };
    window.__booking=booking;
    let calendar=[{day:'2026-12-20',status:'occupied'},{day:'2026-12-21',status:'occupied'},{day:'2026-12-22',status:'occupied'}];
    const mode=new URL(location.href).searchParams.get('mode')||'v30';
    const site={id:'00000000-0000-4000-8000-000000000a01',slug:'synthetic-site',display_name:'LOC démonstration'};
    const unit={id:booking.unit_id,slug:'synthetic-unit',display_name:'Logement démo',sort_order:1,is_active:true,base_price:18000,price_currency:'XOF'};
    const query=(table)=>{
      const obj={
        select:()=>obj,eq:()=>obj,gte:()=>obj,order:()=>obj,
        maybeSingle:async()=>({data:site,error:null}),
        then:(resolve,reject)=>Promise.resolve({
          data:table==='digiy_loc_master_units'?[unit]:
              table==='digiy_loc_master_unit_calendar'?calendar:
              table==='digiy_loc_master_unit_prices'?[]:[],
          error:null
        }).then(resolve,reject)
      };
      return obj;
    };
    window.supabase={createClient:()=>({
      auth:{
        getSession:async()=>({data:{session:{access_token:'fictional',user:{email:'owner@synthetic.test'}}}}),
        onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
        signOut:async()=>({error:null}),
        signInWithOtp:async()=>{throw Error('OTP prohibited in browser fixture');}
      },
      from:query,
      rpc:async(name,args)=>{
        window.__calls.push({name,args});
        if(name==='digiy_loc_master_list_reservations_v2'){
          if(mode==='legacy')return {data:null,error:{code:'PGRST202',message:'Could not find the function in schema cache'}};
          if(mode==='denied')return {data:null,error:{code:'42501',message:'permission denied'}};
          return {data:[{...booking}],error:null};
        }
        if(name==='digiy_loc_master_list_reservations_v1'){
          return {data:[{...booking,status:undefined}],error:null};
        }
        if(name==='digiy_loc_master_cancel_reservation_v1'){
          if(mode==='cancelerror')return {data:null,error:{code:'P0001',message:'OWNER_FORBIDDEN'}};
          if(mode==='cancelunknown')return {data:{ok:false,status:'active'},error:null};
          booking.status='cancelled';booking.cancelled_at='2026-10-08T00:00:00Z';
          if(mode!=='legacyblocked')calendar=[];
          const kept=mode==='legacyblocked'?3:0;
          return {data:{ok:true,status:'cancelled',released_days:3-kept,retained_blocked_days:kept,already_cancelled:false},error:null};
        }
        throw Error('Unexpected live RPC forbidden: '+name);
      }
    })};
  });
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith('file:'))return route.continue();
    if(url.startsWith('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'))
      return route.fulfill({status:200,contentType:'application/javascript',body:'/* supplied by addInitScript: mock Supabase */'});
    return route.abort();
  });
});
for(const item of cases){
  test(item.name+' — active booking can be explicitly cancelled without external traffic',async({page})=>{
    await page.goto(file(item.html,item.params+'v30'),{waitUntil:'domcontentloaded'});
    await expect(page.locator('#managerPanel')).toBeVisible();
    const button=page.getByRole('button',{name:/Annuler la réservation de Client fictif/});
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText('Annulée',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:/Annuler la réservation de/})).toHaveCount(0);
    const evidence=await page.evaluate(()=>({
      confirmations:window.__confirmations,
      calls:window.__calls.map(x=>x.name),
      booking:window.__booking.status,
      outbound:window.__outbound
    }));
    expect(evidence.confirmations).toBe(1);
    expect(evidence.calls).toContain('digiy_loc_master_cancel_reservation_v1');
    expect(evidence.booking).toBe('cancelled');
    expect(evidence.outbound).toEqual([]);
  });
  test(item.name+' — legacy RPC keeps owner carnet but provides NO cancel action',async({page})=>{
    await page.goto(file(item.html,item.params+'legacy'),{waitUntil:'domcontentloaded'});
    await expect(page.locator('#managerPanel')).toBeVisible();
    await expect(page.getByText('Client fictif de test').first()).toBeVisible();
    await expect(page.getByRole('button',{name:/Annuler la réservation de/})).toHaveCount(0);
    const calls=await page.evaluate(()=>window.__calls.map(x=>x.name));
    expect(calls).toContain('digiy_loc_master_list_reservations_v1');
    expect(calls).not.toContain('digiy_loc_master_cancel_reservation_v1');
  });
  test(item.name+' — server refuses cancellation: active booking remains untouched',async({page})=>{
    await page.goto(file(item.html,item.params+'cancelerror'),{waitUntil:'domcontentloaded'});
    await expect(page.locator('#managerPanel')).toBeVisible();
    const button=page.getByRole('button',{name:/Annuler la réservation de Client fictif/});
    await expect(button).toBeVisible();
    await button.click();
    await expect(button).toBeEnabled();
    await expect(page.getByText(/Annulation refusée.*OWNER_FORBIDDEN/)).toBeVisible();
    await expect(page.getByText('Annulée',{exact:true})).toHaveCount(0);
    const evidence=await page.evaluate(()=>({
      status:window.__booking.status,
      calls:window.__calls.map(x=>x.name),
      outbound:window.__outbound
    }));
    expect(evidence.status).toBe('active');
    expect(evidence.calls).toContain('digiy_loc_master_cancel_reservation_v1');
    expect(evidence.outbound).toEqual([]);
  });
  test(item.name+' — ambiguous server reply cannot mark reservation cancelled',async({page})=>{
    await page.goto(file(item.html,item.params+'cancelunknown'),{waitUntil:'domcontentloaded'});
    await expect(page.locator('#managerPanel')).toBeVisible();
    const button=page.getByRole('button',{name:/Annuler la réservation de Client fictif/});
    await button.click();
    await expect(button).toBeEnabled();
    await expect(page.getByText(/Annulation non confirmée par le serveur/)).toBeVisible();
    await expect(page.getByText('Annulée',{exact:true})).toHaveCount(0);
    const status=await page.evaluate(()=>window.__booking.status);
    expect(status).toBe('active');
  });
  test(item.name+' — legacy blocked days stay blocked after authorized cancellation',async({page})=>{
    await page.goto(file(item.html,item.params+'legacyblocked'),{waitUntil:'domcontentloaded'});
    await expect(page.locator('#managerPanel')).toBeVisible();
    await page.getByRole('button',{name:/Annuler la réservation de Client fictif/}).click();
    await expect(page.getByText('Annulée',{exact:true})).toBeVisible();
    await expect(page.getByText(/3 date\(s\) restent bloquées.*vérification manuelle/)).toBeVisible();
    const evidence=await page.evaluate(()=>({status:window.__booking.status,outbound:window.__outbound}));
    expect(evidence.status).toBe('cancelled');
    expect(evidence.outbound).toEqual([]);
  });
  test(item.name+' — permission error does not silently fallback or offer cancel',async({page})=>{
    await page.goto(file(item.html,item.params+'denied'),{waitUntil:'domcontentloaded'});
    await expect(page.locator('#managerPanel')).toBeVisible();
    await expect(page.getByRole('button',{name:/Annuler la réservation de/})).toHaveCount(0);
    const calls=await page.evaluate(()=>window.__calls.map(x=>x.name));
    expect(calls).not.toContain('digiy_loc_master_list_reservations_v1');
  });
}
