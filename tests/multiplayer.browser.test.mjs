import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { CONTENT, NARRATIVE_BRANCHES } from '../server/content.mjs';

// Run against the real application and its migrated local D1, never a mock API.
const baseURL=process.env.MULTIPLAYER_TEST_URL||'http://127.0.0.1:5173';
const executablePath=process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browserOptions={headless:true,executablePath,args:process.env.CI?['--no-sandbox']:[]};

async function view(page){
 return page.evaluate(async()=>{
  const room=JSON.parse(localStorage.getItem('lpdate-mp'));
  const response=await fetch(`/api/multiplayer?code=${room.code}`,{headers:{Authorization:`Bearer ${room.token}`}});
  if(!response.ok)throw Error(`State HTTP ${response.status}`);
  return response.json();
 });
}
async function eventually(check,message){
 const end=Date.now()+30000;
 while(Date.now()<end){if(await check())return;await delay(100);}
 assert.fail(message);
}
async function open(page){await page.goto(`${baseURL}/solo/index.html`);await page.click('#openMultiplayer');}
async function createPair(browser,mode){
 const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));
 for(const page of pages){
  page.setDefaultTimeout(30000);
  page.errors=[];page.on('pageerror',e=>page.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(baseURL)&&r.status()>=400)page.errors.push(`HTTP ${r.status()}: ${new URL(r.url()).pathname}`);});
 }
 await Promise.all(pages.map(open));
 await pages[0].click('#mp-create');await pages[0].locator('.mp-code').waitFor();
 const code=await pages[0].locator('.mp-code').textContent();
 await pages[1].fill('#mp-join-code',code);await pages[1].click('#mp-join');
 await pages[1].locator('#mp-ready').waitFor();
 await pages[0].click(`[data-mode="${mode}"]`);
 await eventually(async()=>await pages[1].locator('#mp-ready').isEnabled(),'Guest never received selected mode');
 await pages[0].click('#mp-ready');await pages[1].click('#mp-ready');
 await Promise.all(pages.map(p=>p.locator('.mp-candidates').waitFor()));
 return {contexts,pages};
}
async function identify(pages,mode){
 if(mode==='coach'){
  assert.equal(await pages[1].locator('[data-seat]').count(),0);
  assert.equal(await pages[0].locator('.mp-photo').count(),0,'Single player received target photo');
  const photo=await pages[1].locator('.mp-photo').getAttribute('src');
  await pages[0].locator(`[data-seat]:has(img[src="${photo}"])`).click();
 }else{
  for(const page of pages){
   const photo=await page.locator('.mp-photo').getAttribute('src');
   await page.locator(`[data-seat]:has(img[src="${photo}"])`).click();
  }
 }
 await Promise.all(pages.map(p=>p.locator('.mp-scene').waitFor()));
}
function authoredScene(s,coach){
 const scenes=s.mode==='doubleDate'?CONTENT.doubleDate.pairs.find(p=>p.title===s.pair.title).rounds:
  (()=>{const p=CONTENT[s.mode].profiles.find(p=>p.name===(s.profile?.name||coach.dossier.name));return p.stories||p.scenes;})();
 const branch=Object.values(NARRATIVE_BRANCHES).flat().find(b=>b.prompt===s.scene.prompt);
 return branch||scenes.find(sc=>sc.id===s.scene.id);
}
const score=e=>Object.values(e||{}).reduce((a,b)=>a+b,0);

test('idle synchronization uses one heartbeat response and stops in hidden or closed views',{timeout:60000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const page=await browser.newPage();
  await page.clock.install();
  const calls=[];
  page.on('request',request=>{
   if(new URL(request.url()).pathname==='/api/multiplayer')calls.push({method:request.method(),action:request.method()==='POST'?request.postDataJSON()?.action?.type:null});
  });
  await open(page);await page.click('#mp-create');await page.locator('.mp-code').waitFor();
  const before=calls.length;
  await Promise.all([
   page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postData()?.includes('heartbeat')),
   page.clock.fastForward(31000),
  ]);
  await delay(100);
  assert.deepEqual(calls.slice(before),[{method:'POST',action:'heartbeat'}],'Heartbeat must not trigger an additional GET');
  await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden=calls.length;await page.clock.fastForward(120000);await delay(100);
  assert.equal(calls.length,hidden,'Hidden page continued polling');
  await Promise.all([
   page.waitForResponse(r=>r.request().method()==='POST'&&r.request().postData()?.includes('heartbeat')),
   page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));}),
  ]);
  await page.click('.mp-close');
  const closed=calls.length;await page.clock.fastForward(120000);await delay(100);
  assert.equal(calls.length,closed,'Closed multiplayer view continued polling');
 }finally{await browser.close();}
});

async function play(pages,mode,policy,{reconnect=false}={}){
 for(let round=1;round<7;round++){
  const s=await view(pages[0]);if(s.ending)return s;
  const coach=mode==='coach'?await view(pages[1]):null,scene=authoredScene(s,coach);
  const ordered=scene.options.toSorted((a,b)=>score(b.effect)-score(a.effect));
  const roles=mode==='coach'?[0]:s.scene.turn&&s.scene.turn!=='simultaneous'?[Number(s.scene.turn.slice(-1))]:[0,1];
  for(const role of roles){
   const fail=policy==='fail'||(mode==='versus'&&role===1);
   const option=fail?ordered.at(-1):ordered[0];
   if(mode==='versus'&&s.scene.turn!=='simultaneous')assert.equal(await pages[1-role].locator('[data-option]').count(),0);
   await pages[role].locator(`[data-option="${option.id}"]`).click();
   if(roles.length===2&&role===0){
    await eventually(async()=>await pages[0].locator('.mp-wait').filter({hasText:'Réponse envoyée'}).isVisible(),'No answer waiting state');
    const hidden=await view(pages[1]);assert.equal(hidden.revealed,null);assert(!('picks'in hidden));
    assert(!JSON.stringify(hidden).includes('"effect"'));
    if(reconnect&&round===1){
     await pages[0].reload();await pages[0].click('#openMultiplayer');
     await pages[0].locator('.mp-wait').filter({hasText:'Réponse envoyée'}).waitFor();
     assert.equal((await view(pages[0])).selected,true);
    }
   }
  }
  await eventually(async()=>{const next=await view(pages[0]);return !!next.ending||next.round!==s.round;},'Round did not resolve');
  // Both clients must display the actual server reaction, including the last turn.
  const resolved=await view(pages[0]);
  await eventually(async()=>{
   for(const page of pages){
    const reactions=await page.locator('.mp-result').allTextContents();
    if(!resolved.lastReveal.every(x=>reactions.some(text=>text.includes(x.reply))))return false;
   }
   return true;
  },'Resolved narrative reactions did not reach both clients');
  if(reconnect&&round===1){
   await pages[1].reload();await pages[1].click('#openMultiplayer');await pages[1].locator('.mp-result').first().waitFor();
   const restored=await view(pages[1]);assert.equal(restored.me,1);assert(restored.round>s.round);
  }
  const next=await view(pages[0]);
  if(next.ending){await Promise.all(pages.map(p=>p.locator('#mp-rematch').waitFor()));return next;}
  await Promise.all(pages.map(p=>p.locator(`.mp-scene[data-round="${next.round}"]`).waitFor()));
 }
 assert.fail('Match never finished');
}

for(const mode of ['doubleDate','versus','coach'])for(const policy of ['win','fail']){
 test(`${mode}: two real clients, ${policy} ending, privacy and rematch`,{timeout:240000},async()=>{
  const browser=await chromium.launch(browserOptions);
  try{
   const {contexts,pages}=await createPair(browser,mode);
   await identify(pages,mode);
   if(mode==='coach'){
    const single=await view(pages[0]),coach=await view(pages[1]);
    assert.equal(single.dossier,undefined);assert.equal(single.targetImage,undefined);
    assert(coach.dossier.secret);assert.equal(coach.scene.options,undefined);
    assert.equal(await pages[1].locator('[data-option]').count(),0);
    await pages[1].locator('summary').first().click();
    await pages[1].fill('#mp-chat-text','Un indice en cours de rédaction');
    await pages[0].fill('#mp-chat-text','Je te laisse me guider.');
    await pages[0].locator('#mp-chat-form button').click();
    await eventually(async()=>await pages[1].locator('.mp-messages').textContent().then(t=>t.includes('Je te laisse')),'Chat not synchronized');
    assert.equal(await pages[1].inputValue('#mp-chat-text'),'Un indice en cours de rédaction');
    assert.equal(await pages[1].locator('details[open]').count(),1);
   }
   const ending=await play(pages,mode,policy,{reconnect:policy==='win'});
   if(mode==='doubleDate')assert.match(ending.ending,policy==='win'?/Les deux rendez-vous se prolongent/:/équipe échoue/);
   if(mode==='versus'){assert.equal(ending.winner,policy==='win'?0:null);assert.match(ending.ending,policy==='win'?/joueur 1/:/rentrer seule/);}
   if(mode==='coach')assert.match(ending.ending,policy==='win'?/deuxième rendez-vous/:/remercie pour la soirée/);
   if(mode==='coach'&&policy==='win'){
    const previous=(await view(pages[1])).dossier.name;
    await pages[1].click('#mp-swap');
    await Promise.all(pages.map(p=>p.locator('#mp-ready').waitFor()));
    await eventually(async()=>await pages[1].locator('[data-mode]').count()===3,'Swapped host did not regain lobby controls');
    await pages[0].click('#mp-ready');await pages[1].click('#mp-ready');
    await pages[0].locator('.mp-candidates').waitFor();await pages[1].locator('[data-seat]').first().waitFor();
    assert.notEqual((await view(pages[0])).dossier.name,previous);
    // Same UI workflow, but the physical devices now have the opposite roles.
    const swapped=[pages[1],pages[0]];await identify(swapped,mode);await play(swapped,mode,'win');
   }
   await pages[0].click('#mp-rematch');await Promise.all(pages.map(p=>p.locator('#mp-ready').waitFor()));
   for(const page of pages){assert.deepEqual(page.errors,[]);assert.equal(await page.locator('.mp-error').count(),0);}
   await Promise.all(contexts.map(c=>c.close()));
  }finally{await browser.close();}
 });
}
