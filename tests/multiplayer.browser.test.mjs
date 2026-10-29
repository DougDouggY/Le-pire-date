import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { arrivalFor } from '../server/date-presentation.mjs';
import { conversationScenes } from '../server/conversation.mjs';
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
async function open(page,name='Camille'){await page.goto(`${baseURL}/solo/index.html`);await page.click('#openMultiplayer');if(await page.locator('#mp-player-name').count())await page.fill('#mp-player-name',name);}
async function createPair(browser,mode,names=['Alex','Robin'],venueChoice='preferred',duoId=null,exerciseChange=false,memberId=null){
 const contexts=await Promise.all([browser.newContext({viewport:{width:390,height:844}}),browser.newContext({viewport:{width:1280,height:720}})]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));
 for(const page of pages){
  page.setDefaultTimeout(30000);
  page.errors=[];page.dialogs=[];page.on('dialog',async dialog=>{page.dialogs.push(dialog.message());await dialog.dismiss();});page.on('pageerror',e=>page.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(baseURL)&&r.status()>=400)page.errors.push(`HTTP ${r.status()}: ${new URL(r.url()).pathname}`);});
 }
 await Promise.all(pages.map((page,role)=>open(page,names[role])));
 await pages[0].click('.mp-close');await pages[0].click(({doubleDate:'#openMultiplayer',versus:'#openVersus',coach:'#openCoach'})[mode]);assert.equal(await pages[0].locator('#mp-player-name').count(),0);await pages[0].click('#mp-create');await pages[0].locator('.mp-code').waitFor();assert.equal(await pages[0].locator('[data-seat]').count(),0);assert.equal(await pages[0].locator('#mp-player-name').count(),0);
 const code=await pages[0].locator('.mp-code').textContent();
 await pages[1].fill('#mp-join-code',code);await pages[1].click('#mp-join');
 await pages[1].locator('#mp-ready').waitFor();
 await pages[0].locator('#mp-player-name').waitFor();
 assert.equal(await pages[0].locator('.mp-forest-player').count(),2);
 assert.match(await pages[0].locator('.fox-0').textContent(),/Joueur 1 · toi/);
 assert.match(await pages[1].locator('.fox-1').textContent(),/Joueur 2 · toi/);
 for(const [role,page] of pages.entries())await page.fill('#mp-player-name',names[role]);
 await pages[0].click('#mp-ready');await pages[1].click('#mp-ready');
 if(mode==='doubleDate')await prepareDoubleDate(pages,duoId,exerciseChange,memberId);
 if(mode==='coach'){await pages[1].locator('.mp-reference-portrait').waitFor();const guide=await view(pages[1]);const p=CONTENT.coach.profiles.find(p=>p.name===guide.dossier.name);const venue=venueChoice==='wrong'?['luxury','kebab','arcade'].find(v=>v!==p.venuePreference):p.venuePreference;await pages[0].locator(`[data-blind-venue="${venue}"]`).click();}
 await pages[0].locator('.mp-candidates').waitFor();await pages[1].locator(mode==='coach'?'.mp-reference-portrait':'.mp-candidates').waitFor();
 return {contexts,pages};
}
async function prepareDoubleDate(pages,duoId=null,exerciseChange=false,memberId=null){
 const selectDuo=async()=>{if(!duoId)return;const target=CONTENT.doubleDate.duos.find(d=>d.id===duoId);for(let i=0;i<4;i++){const id=await pages[0].locator('#mp-like-profile').getAttribute('data-profile');if(target.profiles.includes(id))return;await pages[0].click('#mp-pass-profile');}throw Error('Duo card not found');};
 for(const [role,page] of pages.entries()){
  await page.locator('#mp-city').waitFor();await page.fill('#mp-city',role?'Lyon':'Paris');await page.click('#mp-city-next');await page.locator('#mp-like-profile').waitFor();
 }
 if(!exerciseChange)await selectDuo();if(memberId)await pages[0].click(`[data-duo-person="${memberId}"]`);
 await pages[0].click('#mp-view-profile');await pages[0].locator('.mp-profile-prompt').first().waitFor();assert.equal(await pages[0].locator('.mp-profile-prompt').count(),3);await pages[0].click('[data-gallery-next]');await pages[0].click('#mp-profile-back');
 let first=await pages[0].locator('#mp-like-profile').getAttribute('data-profile');
 const before=(await view(pages[1])).foxy.profiles;assert.equal(before.length,4);assert(before.some(p=>p.duo.members.some(m=>m.id===first)));
 await pages[0].click('#mp-like-profile');await pages[0].locator('[data-foxy-step="waiting"]').waitFor();
 await eventually(async()=>(await view(pages[1])).foxy.profiles.length===1,'Partner did not receive the fixed counterpart');
 if(exerciseChange){
  await pages[1].locator('[data-duo-change="true"]').click();
  await eventually(async()=>(await view(pages[0])).foxy.changeVotes[1],'Change proposal was not synchronized');
  assert.equal((await view(pages[0])).foxy.profiles.length,1,'One change vote reset the duo');
  await pages[1].reload();await pages[1].click('#openMultiplayer');await pages[1].click('#mp-resume');await pages[1].locator('[data-duo-change="false"]').waitFor();
  await pages[0].locator('[data-duo-change="true"]').click();
  await eventually(async()=>(await view(pages[0])).foxy.profiles.length===4&&(await view(pages[1])).foxy.profiles.length===4,'Two votes did not restore the four duos');
  await pages[0].locator('#mp-like-profile').waitFor();await selectDuo();first=await pages[0].locator('#mp-like-profile').getAttribute('data-profile');await pages[0].click('#mp-like-profile');
  await eventually(async()=>(await view(pages[1])).foxy.profiles.length===1,'New counterpart was not synchronized');
 }

 const counterpart=(await view(pages[1])).foxy.profiles[0].id;assert.notEqual(counterpart,first);assert(CONTENT.doubleDate.duos.some(d=>d.profiles.includes(first)&&d.profiles.includes(counterpart)));await pages[1].locator('.mp-duo-proposal').waitFor();
 await pages[1].locator(`#mp-like-profile[data-profile="${counterpart}"]`).waitFor();await pages[1].click('#mp-like-profile');
 assert.equal((await view(pages[1])).stage,'foxy');
 await pages[0].click('#mp-confirm-match');assert.equal((await view(pages[0])).stage,'foxy');await pages[1].click('#mp-confirm-match');
 await Promise.all(pages.map(p=>p.locator('[data-venue]').first().waitFor()));
 await pages[0].click('[data-venue="kebab"]');await pages[1].click('[data-venue="arcade"]');
 assert.equal((await view(pages[0])).stage,'venue','Disagreeing venue votes started the date');
 await pages[1].click('[data-venue="kebab"]');
 assert.equal((await view(pages[1])).stage,'venue');await pages[0].click('#mp-confirm-venue');assert.equal((await view(pages[0])).stage,'venue');await pages[1].click('#mp-confirm-venue');
}
async function identify(pages,mode){
 if(mode==='coach'){
  assert.equal(await pages[1].locator('[data-seat]').count(),0);assert.equal(await pages[1].locator('.mp-candidates').count(),0);assert.equal((await view(pages[1])).seats,null);
  assert.equal(await pages[0].locator('.mp-photo').count(),0,'Single player received target photo');
  const reference=await pages[1].locator('.mp-photo').getAttribute('src');const photo=Object.values(CONTENT).flatMap(c=>c.profiles).find(p=>p.media.photos.includes(reference)).media.actor.neutral;
  await pages[0].locator(`[data-seat]:has(img[src="${photo}"])`).click();
 }else{
  for(const page of pages){
   const reference=await page.locator('.mp-photo').getAttribute('src');const photo=Object.values(CONTENT).flatMap(c=>c.profiles).find(p=>p.media.photos.includes(reference)).media.actor.neutral;
   await page.locator(`[data-seat]:has(img[src="${photo}"])`).click();
  }
 }
 await pages[0].locator('.mp-scene').waitFor();if(mode!=='coach')await pages[1].locator('.mp-scene').waitFor();
}
function authoredScene(s,coach){
 const p=s.mode==='doubleDate'?CONTENT.doubleDate.profiles.find(p=>p.name===s.profiles.find(p=>p.mine).name):CONTENT[s.mode].profiles.find(p=>p.name===(s.profile?.name||coach.dossier.name));
 const original=s.mode==='doubleDate'?p.duoScenes:s.mode==='coach'?p.communicationScenes:p.stories;
 const scenes=conversationScenes(p,original,s.venue?.id);
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

async function choicesFit(page){
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 const box=await page.evaluate(()=>{const choices=[...document.querySelectorAll('[data-option]')];return {height:innerHeight,overflow:document.querySelector('#mp-overlay').scrollWidth>innerWidth,choices:choices.map(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,font:parseFloat(getComputedStyle(el).fontSize)}))};});
 assert.equal(box.overflow,false);assert(box.choices.length>0);
 for(const choice of box.choices){assert(choice.top>=0);assert(choice.bottom<=box.height,`Choice ends at ${choice.bottom} beyond ${box.height}px viewport`);assert(choice.font>=13);}
}
async function play(pages,mode,policy,{reconnect=false}={}){
 for(let round=1;round<7;round++){
  const initial=await view(pages[0]);if(initial.ending)return initial;
  const coach=mode==='coach'?await view(pages[1]):null;
  const roles=mode==='coach'?[0]:initial.scene.turn&&initial.scene.turn!=='simultaneous'?[Number(initial.scene.turn.slice(-1))]:[0,1];
  for(const role of roles){
   const current=await view(pages[role]),scene=authoredScene(current,coach);
   const ordered=scene.options.toSorted((a,b)=>score(b.effect)-score(a.effect));const fail=policy==='fail'||(mode==='versus'&&role===1);const option=fail?ordered.at(-1):ordered[0];
   if(mode==='versus'&&initial.scene.turn!=='simultaneous')assert.equal(await pages[1-role].locator('[data-option]').count(),0);
   await pages[role].locator(`[data-option="${option.id}"]`).waitFor();await choicesFit(pages[role]);await pages[role].locator(`[data-option="${option.id}"]`).click();
   if(mode==='doubleDate'){await pages[role].locator('.mp-spoken-reply').filter({hasText:option.reply}).waitFor();assert.equal((await view(pages[1-role])).lastReveal.length,role===0?0:1);}
   else if(roles.length===2&&role===0)await pages[0].locator('.mp-wait').waitFor();
   if(roles.length===2&&role===0){const hidden=await view(pages[1]);assert(!('picks'in hidden));assert(!JSON.stringify(hidden).includes('"effect"'));}
   if(reconnect&&round===1&&role===0){
    await pages[0].reload();await pages[0].click('#openMultiplayer');await pages[0].click('#mp-resume');
    await pages[0].locator(mode==='doubleDate'||mode==='coach'?'.mp-spoken-reply':'.mp-wait').waitFor();
   }
  }
  const readers=mode==='coach'?[pages[0]]:pages;await Promise.all(readers.map(p=>p.locator('#mp-next-scene').waitFor()));
  for(const page of readers){const s=await view(page);assert(s.reaction);await eventually(async()=>{const rendered=await page.locator('.mp-result').allTextContents();return s.lastReveal.every(x=>rendered.some(text=>text.includes(x.text)&&text.includes(x.reply)));},'The complete chosen reply did not render');assert(await page.locator('.mp-spoken-reply').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=18));}
  if(reconnect&&round===1){await pages[1].reload();await pages[1].click('#openMultiplayer');await pages[1].click('#mp-resume');await pages[1].locator(mode==='coach'?'.mp-reference-phone':'#mp-next-scene').waitFor();assert.equal((await view(pages[1])).me,1);}
  await pages[0].click('#mp-next-scene');if(mode!=='coach'){assert((await view(pages[0])).reaction,'One reader skipped the reaction for both');await pages[1].click('#mp-next-scene');}else{const guide=await view(pages[1]);assert.equal(guide.scene,null);assert.deepEqual(guide.lastReveal,[]);assert.equal(await pages[1].locator('[data-option],.mp-spoken-reply').count(),0);}
  await eventually(async()=>{const next=await view(pages[0]);return !next.reaction;},'Both readers did not resume the date');
  const next=await view(pages[0]);
  if(next.ending){await Promise.all(pages.map(p=>p.locator('#mp-rematch').waitFor()));return next;}
  await Promise.all((mode==='coach'?[pages[0]]:pages).map(p=>p.locator(`.mp-scene[data-round="${next.round}"]`).waitFor()));
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
    assert(coach.dossier.bio);assert.equal(coach.scene,null);assert.deepEqual(coach.lastReveal,[]);
    assert.equal(await pages[1].locator('[data-option],.mp-spoken-reply,.mp-candidates').count(),0);
    const original=await pages[1].locator('.mp-reference-portrait').getAttribute('src');await pages[1].click('[data-gallery-next]');assert.notEqual(await pages[1].locator('.mp-reference-portrait').getAttribute('src'),original);
    assert.equal(await pages[1].locator('.mp-reference-portrait').evaluate(img=>getComputedStyle(img).objectFit),'contain');
    await pages[0].locator('.mp-chat-pocket>summary').click();
    await pages[1].fill('#mp-chat-text','Un indice en cours de rédaction');await pages[0].fill('#mp-chat-text','Je te laisse me guider.');await pages[0].locator('#mp-chat-form button').click();
    await eventually(async()=>await pages[1].locator('.mp-messages').textContent().then(t=>t.includes('Je te laisse')),'Chat not synchronized');
    assert.equal(await pages[1].inputValue('#mp-chat-text'),'Un indice en cours de rédaction');assert.match(await pages[1].locator('[data-gallery-count]').textContent(),/2 \/ 4/);
   }
   const ending=await play(pages,mode,policy,{reconnect:policy==='win'});
   if(mode==='doubleDate')assert.match(ending.ending,policy==='win'?/Les deux rendez-vous se prolongent/:/équipe échoue/);
   if(mode==='versus'){assert.equal(ending.winner,policy==='win'?0:null);assert.match(ending.ending,policy==='win'?/joueur 1/:/rentrer seule/);}
   if(mode==='coach')assert.match(ending.ending,policy==='win'?/deuxième rendez-vous/:/remercie pour la soirée/);
   for(const page of pages){const local=await page.evaluate(()=>window.LP_CONTACTS.data());assert.equal(local.stats.games,1);assert.equal(Object.values(local.players)[0].stats.games,1);}
   await pages[0].click('#mp-contacts');await pages[0].locator('#player-contact-list').waitFor();assert.equal(await pages[0].locator('[data-contact]').count(),1);if(policy==='win')assert.equal(await pages[0].locator('[data-date]').count(),1);await pages[0].click('#contactsBack');await pages[0].click('#openMultiplayer');await pages[0].click('#mp-resume');await pages[0].locator('#mp-rematch').waitFor();assert.equal(await pages[0].evaluate(()=>window.LP_CONTACTS.data().stats.games),1);
   if(mode==='coach'&&policy==='win'){
    const previous=(await view(pages[1])).dossier.name;
    await pages[1].click('#mp-swap');assert.equal((await view(pages[1])).phase,'playing');await pages[0].click('#mp-swap');
    await Promise.all(pages.map(p=>p.locator('#mp-ready').waitFor()));
    await eventually(async()=>await pages[1].locator('#mp-difficulty').count()===1,'Swapped host did not regain lobby controls');
    await pages[0].click('#mp-ready');await pages[1].click('#mp-ready');
    await pages[0].locator('.mp-reference-portrait').waitFor();const guide=await view(pages[0]);const target=CONTENT.coach.profiles.find(p=>p.name===guide.dossier.name);await pages[1].locator(`[data-blind-venue="${target.venuePreference}"]`).click();await pages[1].locator('[data-seat]').first().waitFor();
    assert.notEqual((await view(pages[0])).dossier.name,previous);
    // Same UI workflow, but the physical devices now have the opposite roles.
    const swapped=[pages[1],pages[0]];await identify(swapped,mode);await play(swapped,mode,'win');
    for(const page of pages){const local=await page.evaluate(()=>window.LP_CONTACTS.data());assert.equal(local.stats.games,2);assert.equal(Object.values(local.players)[0].stats.games,2);assert.equal(Object.keys(local.dates).length,2);}
   }
   await pages[0].click('#mp-rematch');assert.equal((await view(pages[0])).phase,'playing');await pages[1].click('#mp-rematch');await Promise.all(pages.map(p=>p.locator('#mp-ready').waitFor()));
   for(const page of pages){assert.deepEqual(page.errors,[]);assert.equal(await page.locator('.mp-error').count(),0);}
   await Promise.all(contexts.map(c=>c.close()));
  }finally{await browser.close();}
 });
}

test('solo success adds a date contact and keeps it after reloading the phone',{timeout:90000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${baseURL}/solo/index.html`);
  assert.equal(await page.locator('.home-app').count(),6);
  await page.locator('.phone-tools summary').click();await page.click('#openTestMode');await page.click('[data-id="zoe"]');
  await page.click('.guest-card[data-target="true"]');await page.locator('[data-choice]').first().waitFor();
  const slots=await page.evaluate(()=>window.DD_DATA.profiles.find(p=>p.id==='zoe').slots);
  for(const slot of slots){await page.click(`[data-choice="${slot}"]`);await page.click('#continueBtn');}
  await page.locator('#restartEnd').waitFor();
  assert.equal(await page.evaluate(()=>window.LP_CONTACTS.data().dates.zoe.wins),1);
  await page.reload();await page.click('#openContacts');await page.locator('[data-date="zoe"]').waitFor();
  assert.equal(await page.evaluate(()=>window.LP_CONTACTS.data().dates.zoe.wins),1);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('display names remain text in player profiles and the shared date roster',{timeout:120000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const name='<svg onload=alert(1)>';
  const {pages}=await createPair(browser,'doubleDate',[name,'Robin']);await identify(pages,'doubleDate');
  for(const page of pages){assert.equal(await page.locator('#mp-content svg').count(),0);assert((await page.locator('#mp-content').textContent()).includes(name));assert.deepEqual(page.errors,[]);assert.deepEqual(page.dialogs,[]);}
 }finally{await browser.close();}
});

test('Blind Foxy: timeout reaction is shown to the single player and kept private from the Coach',{timeout:120000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const {pages}=await createPair(browser,'coach');await identify(pages,'coach');
  const before=await view(pages[0]);await pages[0].locator('[data-deadline]').waitFor();
  assert.equal(before.dossier,undefined);assert((await view(pages[1])).dossier);
  await delay(46000);
  await eventually(async()=>{const after=await view(pages[0]);return !!after.reaction&&after.timeoutCount===1&&after.deadline===null;},'Deadline did not advance the round');
  await pages[0].locator('.mp-result').filter({hasText:'Tu es encore avec moi ?'}).waitFor();assert(!/affinité|−2/.test(await pages[0].locator('.mp-result').textContent()));assert.equal(await pages[1].locator('.mp-result').count(),0);assert.deepEqual((await view(pages[1])).lastReveal,[]);
  const after=await view(pages[1]);assert.equal(after.timeoutCount,1);assert.equal(after.round,before.round);assert.equal(after.scene,null);await pages[0].click('#mp-next-scene');assert.equal((await view(pages[0])).round,before.round+1);assert.equal((await view(pages[0])).timeoutCount,1);
  for(const page of pages)assert.deepEqual(page.errors,[]);
 }finally{await browser.close();}
});

for(const [button,mode] of [['openMultiplayer','doubleDate'],['openVersus','versus'],['openCoach','coach']]){
 test(`${mode}: unavailable saved room recovers without losing contacts and a new invitation works`,{timeout:60000},async()=>{
  const browser=await chromium.launch(browserOptions);
  try{
   const contexts=await Promise.all([browser.newContext({viewport:{width:390,height:844}}),browser.newContext({viewport:{width:1280,height:720}})]);const pages=await Promise.all(contexts.map(c=>c.newPage()));const [host,guest]=pages;
   await host.goto(`${baseURL}/solo/`);assert.equal(await host.locator('#openVersus span').textContent(),'Foxy Versus');assert(await host.locator('.foxy-mode-icon').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
   const snapshot=await host.evaluate(()=>{window.LP_CONTACTS.player('Camille');const snapshot=localStorage.getItem('lpdate.contacts.v1');const room={code:'PASTROOM',token:crypto.randomUUID()+crypto.randomUUID(),role:0};localStorage.setItem('lpdate-mp',JSON.stringify(room));localStorage.setItem('lpdate-mp-recovery',JSON.stringify(room));return snapshot;});
   await host.reload();const calls=[];host.on('request',r=>{if(new URL(r.url()).pathname==='/api/multiplayer')calls.push(r.method());});
   await host.click(`#${button}`);assert.equal(calls.length,0,'Opening the app tried to resume the old room');
   await host.click('#mp-resume');await host.locator('.mp-notice').waitFor();
   assert.equal(await host.locator('.mp-error').count(),0);assert.equal(await host.locator('#mp-resume').count(),0);
   assert.equal(await host.evaluate(()=>localStorage.getItem('lpdate.contacts.v1')),snapshot);
   assert.equal(await host.evaluate(()=>localStorage.getItem('lpdate-mp')),null);assert.equal(await host.evaluate(()=>localStorage.getItem('lpdate-mp-recovery')),null);
   await host.clock.install();const stopped=calls.length;await host.clock.fastForward(60000);await delay(100);assert.equal(calls.length,stopped,'Expired room kept polling');await host.clock.resume();
   await host.click('#mp-create');await host.locator('.mp-code').waitFor();const code=await host.locator('.mp-code').textContent();assert.notEqual(code,'PASTROOM');
   await guest.goto(`${baseURL}/solo/`);await guest.click(`#${button}`);await guest.fill('#mp-join-code',code);await guest.click('#mp-join');await guest.locator('#mp-ready').waitFor();
   const joined=await view(guest);assert.equal(joined.mode,mode);assert.equal(joined.me,1);assert.equal(await guest.locator('.mp-error').count(),0);
   await host.clock.fastForward(10000);await host.locator('#mp-ready').waitFor();assert.equal((await view(host)).mode,mode);
   const session=await host.evaluate(()=>JSON.parse(localStorage.getItem('lpdate-mp')));assert(session.expiresAt>Date.now());
   await host.click('.mp-close');await host.evaluate(()=>{const room=JSON.parse(localStorage.getItem('lpdate-mp'));room.expiresAt=Date.now()-1;localStorage.setItem('lpdate-mp',JSON.stringify(room));});await host.click(`#${button}`);assert.equal(await host.locator('#mp-resume').count(),0);
  }finally{await browser.close();}
 });
}

test('a room lost while setting a nickname returns to an enabled invitation screen',{timeout:60000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const contexts=await Promise.all([browser.newContext({viewport:{width:390,height:844}}),browser.newContext({viewport:{width:1280,height:720}})]);const [host,guest]=await Promise.all(contexts.map(c=>c.newPage()));
  await open(host);await host.click('#mp-create');await host.locator('.mp-code').waitFor();const code=await host.locator('.mp-code').textContent();
  await open(guest);await guest.fill('#mp-join-code',code);await guest.click('#mp-join');await host.locator('#mp-ready').waitFor();await host.fill('#mp-player-name','Camille');
  // Inject a server-side disappearance between the displayed lobby and Ready.
  await host.route('**/api/multiplayer',async route=>{const r=route.request();if(r.method()==='POST'&&r.postDataJSON()?.action?.type==='rename')return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Salon introuvable ou expiré'})});return route.continue();});
  await host.click('#mp-ready');await host.locator('.mp-notice').waitFor();assert(await host.locator('#mp-create').isEnabled());assert.equal(await host.locator('.mp-error').count(),0);
  await host.unroute('**/api/multiplayer');await host.click('#mp-create');await host.locator('.mp-code').waitFor();assert.notEqual(await host.locator('.mp-code').textContent(),code);
 }finally{await browser.close();}
});

test('Blind Foxy profile photos remain whole and locally browsable while live dialogue stays private',{timeout:90000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const {pages}=await createPair(browser,'coach'),single=pages[0],coach=pages[1];
  const posts=[];coach.on('request',r=>{if(new URL(r.url()).pathname==='/api/multiplayer'&&r.method()==='POST')posts.push(r.postDataJSON());});
  const reference=await coach.locator('.mp-reference-portrait').getAttribute('src');const seen=new Set([reference]);
  for(let i=0;i<3;i++){await coach.click('[data-gallery-next]');await coach.locator('.mp-reference-portrait').evaluate(img=>img.decode());seen.add(await coach.locator('.mp-reference-portrait').getAttribute('src'));}
  assert.equal(seen.size,4);assert.equal(posts.length,0,'Browsing profile photos posted a game action');
  const fitting=await coach.locator('.mp-reference-portrait').evaluate(img=>({fit:getComputedStyle(img).objectFit,ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height,natural:img.naturalWidth/img.naturalHeight}));assert.equal(fitting.fit,'contain');assert(Math.abs(fitting.ratio-fitting.natural)<.03);
  assert.equal(await coach.locator('.mp-profile-prompt').count(),3);assert.equal(await coach.locator('.mp-candidates').count(),0);
  await identify(pages,'coach');const photo=await coach.locator('.mp-reference-portrait').getAttribute('src');
  await single.locator('[data-option]').first().click();await single.locator('.mp-spoken-reply').waitFor();assert.equal((await view(coach)).scene,null);assert.equal(await coach.locator('.mp-spoken-choice,.mp-spoken-reply,.mp-question').count(),0);
  await single.click('#mp-next-scene');await eventually(async()=>(await view(coach)).round===2,'Second scene did not begin');
  assert.equal(await coach.locator('.mp-reference-portrait').getAttribute('src'),photo);assert.equal((await view(coach)).scene,null);
  for(const page of pages)assert.deepEqual(page.errors,[]);
 }finally{await browser.close();}
});


test('Blind Foxy: an unsuitable venue stays selected; the two-second reaction returns to cumulative mood without exposing scores',{timeout:90000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const {pages}=await createPair(browser,'coach',['Alex','Robin'],'wrong');await identify(pages,'coach');
  const initial=await view(pages[0]);await choicesFit(pages[0]);assert(initial.arrivalNotice);assert.equal(initial.actor.mood,'displeased');assert.equal(initial.scores,undefined);
  await pages[0].locator('.mp-notice').waitFor();assert(!/affinité|points de respect/.test(await pages[0].locator('.mp-notice').textContent()));
  const guide=await view(pages[1]);const authored=authoredScene(initial,guide),option=authored.options.toSorted((a,b)=>score(b.effect)-score(a.effect))[0];
  await pages[0].click(`[data-option="${option.id}"]`);await pages[0].locator('.mp-spoken-reply').waitFor();
  const reply=await view(pages[0]);assert(reply.actor.transient);assert.notEqual(reply.actor.transient.photo,reply.actor.photo);
  assert.equal(await pages[0].locator('[data-actor-image]').getAttribute('src'),reply.actor.transient.photo);
  await eventually(async()=>await pages[0].locator('[data-actor-image]').getAttribute('src')===reply.actor.photo,'Transient face did not return to cumulative mood');
  await delay(2500);assert.equal(await pages[0].locator('[data-actor-image]').getAttribute('src'),reply.actor.photo,'Polling replayed the reaction');
  assert.equal((await view(pages[0])).venue.id,initial.venue.id);
  const coach=await view(pages[1]);assert.equal(coach.actor,undefined);assert.equal(coach.scene,null);assert.equal(coach.arrivalNotice,undefined);assert.equal(await pages[1].locator('[data-actor-image],.mp-spoken-reply').count(),0);
  await pages[0].setViewportSize({width:390,height:844});
  const layout=await pages[0].evaluate(()=>({actor:document.querySelector('.mp-restaurant-scene').getBoundingClientRect().bottom,dialogue:document.querySelector('.mp-conversation').getBoundingClientRect().top,overflow:document.querySelector('#mp-overlay').scrollWidth>innerWidth}));
  assert(layout.dialogue>=layout.actor-2);assert.equal(layout.overflow,false);
  for(const page of pages)assert.deepEqual(page.errors,[]);
 }finally{await browser.close();}
});


test('all profile questions and three choices fit together across desktop and phone sizes',{timeout:90000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const {pages}=await createPair(browser,'doubleDate');await identify(pages,'doubleDate');const page=pages[0];
  // Keep the real rendered game and its styles; stop polling while measuring
  // the complete authored text catalogue, including the longest branch prompts.
  await page.click('.mp-close');await page.evaluate(()=>document.querySelector('#mp-overlay').classList.add('on'));
  const fixtures=[];
  for(const [mode,pool]of Object.entries(CONTENT))for(const p of pool.profiles){
   const route=conversationScenes(p,p.duoScenes||p.communicationScenes||p.stories,'kebab');fixtures.push(...route);if(mode==='coach')fixtures.push({...route[0],arrivalNotice:arrivalFor(p,'kebab',true)});
   for(const [key,branches]of Object.entries(NARRATIVE_BRANCHES))if(key.startsWith(p.id+':'))fixtures.push(...branches.map(b=>({...b,transition:'La conversation revient sur ce qui a été dit un peu plus tôt.'})));
  }
  for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:360,height:640}]){
   await page.setViewportSize(viewport);
   for(const fixture of fixtures){
    await page.evaluate(scene=>{const box=document.querySelector('.mp-scene');box.replaceChildren();const title=document.createElement('p');title.className='mp-kicker';title.textContent='Foxy · 1/6';box.append(title);if(scene.arrivalNotice){const notice=document.createElement('p');notice.className='mp-notice';notice.textContent=scene.arrivalNotice;box.append(notice);}
     const transition=document.createElement('p');transition.className='mp-transition';transition.textContent=scene.transition||'';box.append(transition);
     const question=document.createElement('p');question.className='mp-question';question.textContent=scene.prompt;box.append(question);
     for(const option of scene.options){const button=document.createElement('button');button.className='mp-choice';button.dataset.option=option.id;button.textContent=option.text;box.append(button);}
     const timer=document.createElement('p');timer.className='mp-timer';timer.textContent='45 s pour répondre';box.append(timer);document.querySelector('#mp-overlay').scrollTop=0;dispatchEvent(new Event('resize'));
    },fixture);
    await choicesFit(page);
   }
  }
 }finally{await browser.close();}
});


for(const duoId of ['duo-quartier','duo-soeurs','duo-musee'])test(`organized ${duoId}: two browsers finish their linked dates`,{timeout:240000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const {pages}=await createPair(browser,'doubleDate',['Alex','Robin'],'preferred',duoId,duoId==='duo-musee');
  const duo=CONTENT.doubleDate.duos.find(d=>d.id===duoId);const states=await Promise.all(pages.map(view));
  assert.deepEqual(states.map(s=>s.profiles[0].id),duo.profiles);for(const page of pages)assert.equal(await page.locator('[data-seat]').count(),4);
  await identify(pages,'doubleDate');await play(pages,'doubleDate','win');for(const page of pages)assert.deepEqual(page.errors,[]);
 }finally{await browser.close();}
});


test('organized duo-studio mirrored: either player can choose either friend',{timeout:240000},async()=>{
 const browser=await chromium.launch(browserOptions);
 try{const {pages}=await createPair(browser,'doubleDate',['Alex','Robin'],'preferred','duo-studio',false,'dd-solene');
  assert.equal((await view(pages[0])).profiles[0].id,'dd-solene');assert.equal((await view(pages[1])).profiles[0].id,'dd-livia');await identify(pages,'doubleDate');await play(pages,'doubleDate','win');for(const page of pages)assert.deepEqual(page.errors,[]);
 }finally{await browser.close();}
});
