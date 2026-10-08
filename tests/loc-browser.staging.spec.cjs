'use strict';
const {test,expect}=require('@playwright/test');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fileUrl=(p,q='')=>pathToFileURL(path.resolve(p)).href+(q?'?'+q:'');

// The browser loads the actual repository HTML, but all external traffic,
// payment, messaging, Supabase auth, and email are hard-blocked.
function fakeSupabase(){
  window.supabase={
    createClient:()=>({
      auth:{
        getSession:async()=>({
          data:{session:['authorized','denied'].includes(new URL(location.href).searchParams.get('mode'))
            ? {access_token:'synthetic-local-token'} : null}
        }),
        signOut:async()=>{window.__signOuts++;return {error:null};}
      },
      rpc:async(name,args)=>{
        window.__rpcCalls.push({name,args});
        if(name!=='digiy_loc_public_room_by_slug')throw Error('Unexpected RPC: '+name);
        if(['hidden-demo','missing-demo'].includes(args.p_slug))
          return {data:{ok:false,error:'room_not_found'},error:null};
        return {data:{ok:true,room:{
          slug:'studio-demo',nom:'Studio démo LOC',status:'actif',
          is_public:true,description:'Séjour fictif de démonstration',
          type_logement:'Studio',city:'Saly',quartier:'Saly Joseph',
          personnes_max:2,prix_nuit:18000,prix_semaine:108000,
          prix_mois:360000,whatsapp_phone:'+221 77 123 45 67',
          call_phone:'+221 33 222 11 00',gallery_urls:'[]'
        }},error:null};
      },
      from:table=>({
        select:()=>({eq:()=>({limit:async()=>{
          window.__fallbackReads.push(table);
          return {data:[],error:null};
        }})})
      })
    })
  };
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    window.__opened=[];window.__rpcCalls=[];window.__fallbackReads=[];
    window.__requests=[];window.__signOuts=0;
    window.open=(...args)=>{window.__opened.push(args);return null;};
    window.fetch=async(input,options={})=>{
      const url=String(input);
      if(!url.startsWith('https://wesqmwjjtsefyjnluosj.supabase.co/functions/v1/'))
        throw Error('External fetch forbidden: '+url);
      window.__requests.push({url,body:options.body||null});
      let status=200,response={ok:true};
      const mode=new URL(location.href).searchParams.get('mode');
      if(url.endsWith('/digiy-loc-owner-access')){
        if(mode==='authorized')response={
          ok:true,business:'LOC Démo',zone:'Saly',plan:'LOC Test',
          paid_until:'2099-12-31',professional_url:'https://example.test/fiche-demo'
        };
        else{status=403;response={ok:false,error:'loc_subscription_inactive'};}
      }else if(url.endsWith('/digiy-loc-magic-link')){
        const email=JSON.parse(options.body||'{}').email;
        response={ok:true,sent:email==='synthetic@active.test'};
      }else throw Error('Unexpected Edge endpoint: '+url);
      return new Response(JSON.stringify(response),{
        status,headers:{'content-type':'application/json'}
      });
    };
  });
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith('file:'))return route.continue();
    if(url.startsWith('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'))
      return route.fulfill({
        status:200,contentType:'application/javascript',
        body:'('+fakeSupabase.toString()+')();'
      });
    return route.abort();
  });
});
test('public LOC fiche renders owner room and direct contact',async({page})=>{
  await page.goto(fileUrl('fiche.html','slug=studio-demo'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#titleEl')).toHaveText('Studio démo LOC');
  await expect(page.locator('#waEl')).toHaveText('WhatsApp direct propriétaire');
  await expect(page.locator('#pnEl')).toContainText('18');
  await expect(page.getByText('0% commission').first()).toBeVisible();
  const calls=await page.evaluate(()=>window.__rpcCalls);
  expect(calls.map(x=>x.name)).toEqual(['digiy_loc_public_room_by_slug']);
});
test('request button builds complete WhatsApp demand addressed to owner only',async({page})=>{
  await page.goto(fileUrl('fiche.html','slug=studio-demo'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#titleEl')).toHaveText('Studio démo LOC');
  await page.locator('#guestName').fill('Client fictif');
  await page.locator('#guestPhone').fill('221 70 000 00 00');
  await page.locator('#checkIn').fill('2026-12-15');
  await page.locator('#checkOut').fill('2026-12-19');
  await page.locator('#guestCount').fill('2');
  await page.locator('#guestBudget').fill('30000 FCFA');
  await page.locator('#guestNote').fill('Séjour de test sans envoi');
  await page.locator('#btnReserve').click();
  const opened=await page.evaluate(()=>window.__opened);
  expect(opened).toHaveLength(1);
  const target=new URL(opened[0][0]);
  expect(target.origin).toBe('https://wa.me');
  expect(target.pathname).toBe('/221771234567');
  const msg=target.searchParams.get('text');
  for(const part of [
    'Studio démo LOC','Client fictif','2026-12-15','2026-12-19',
    '30000 FCFA','Séjour de test sans envoi','0% commission','paiement direct'
  ])expect(msg).toContain(part);
  expect(opened[0][2]).toBe('noopener,noreferrer');
  expect(await page.evaluate(()=>window.__requests)).toEqual([]);
});
test('quick WhatsApp button chooses the same direct owner',async({page})=>{
  await page.goto(fileUrl('fiche.html','slug=studio-demo'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#titleEl')).toHaveText('Studio démo LOC');
  await page.locator('#btnWaQuick').click();
  const urls=await page.evaluate(()=>window.__opened.map(x=>x[0]));
  expect(urls).toHaveLength(1);
  expect(new URL(urls[0]).pathname).toBe('/221771234567');
});
test('hidden or missing room does not expose a booking contact',async({page})=>{
  await page.goto(fileUrl('fiche.html','slug=hidden-demo'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#titleEl')).toHaveText('Logement introuvable');
  await page.locator('#btnReserve').click();
  expect(await page.evaluate(()=>window.__opened)).toEqual([]);
});
test('fiche removes sensitive URL parameters before displaying content',async({page})=>{
  await page.goto(fileUrl('fiche.html','slug=studio-demo&phone=221770000000&token=test-secret&pin4=1234'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#titleEl')).toHaveText('Studio démo LOC');
  const url=new URL(page.url());
  for(const key of ['phone','token','pin4'])expect(url.searchParams.has(key)).toBe(false);
});
test('owner without authenticated session remains outside owner area',async({page})=>{
  await page.goto(fileUrl('staging/pro-loc/index.html'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#login')).toBeVisible();
  await expect(page.locator('#inside')).toBeHidden();
  await expect(page.locator('#status')).toContainText('Aucune session LOC active');
  expect(await page.evaluate(()=>window.__requests)).toEqual([]);
});
test('active synthetic email triggers only a MOCK magic-link request',async({page})=>{
  await page.goto(fileUrl('staging/pro-loc/index.html'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#login')).toBeVisible();
  await page.locator('#email').fill('synthetic@active.test');
  await page.locator('#send').click();
  await expect(page.locator('#status')).toContainText('Magic link envoyé');
  const calls=await page.evaluate(()=>window.__requests);
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toContain('/digiy-loc-magic-link');
  expect(JSON.parse(calls[0].body)).toEqual({email:'synthetic@active.test'});
  await expect(page.locator('#inside')).toBeHidden();
});
test('inactive synthetic email is denied magic link in mocked provider',async({page})=>{
  await page.goto(fileUrl('staging/pro-loc/index.html'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#login')).toBeVisible();
  await page.locator('#email').fill('synthetic@inactive.test');
  await page.locator('#send').click();
  await expect(page.locator('#status')).toContainText('Aucun accès LOC actif');
  await expect(page.locator('#inside')).toBeHidden();
});
test('owner area opens only after mocked JWT and subscription verification',async({page})=>{
  await page.goto(fileUrl('staging/pro-loc/index.html','mode=authorized'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#inside')).toBeVisible();
  await expect(page.locator('#login')).toBeHidden();
  await expect(page.locator('#status')).toContainText('DROIT LOC ACTIF');
  await expect(page.locator('#meta')).toContainText('LOC Démo');
  expect(await page.locator('#fiche').getAttribute('href')).toBe('https://example.test/fiche-demo');
  const calls=await page.evaluate(()=>window.__requests);
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toContain('/digiy-loc-owner-access');
  await page.locator('#logout').click();
  await expect(page.locator('#inside')).toBeHidden();
  await expect(page.locator('#login')).toBeVisible();
  expect(await page.evaluate(()=>window.__signOuts)).toBe(1);
});
test('denied owner is signed out without access to owner commands',async({page})=>{
  await page.goto(fileUrl('staging/pro-loc/index.html','mode=denied'),{waitUntil:'domcontentloaded'});
  await expect(page.locator('#login')).toBeVisible();
  await expect(page.locator('#inside')).toBeHidden();
  await expect(page.locator('#status')).toContainText('Accès LOC refusé');
  expect(await page.evaluate(()=>window.__signOuts)).toBe(1);
});
