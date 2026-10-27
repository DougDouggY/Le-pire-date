import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT, NARRATIVE_BRANCHES, getProfile, getPair } from './content.mjs';
import { act, createRoom, joinRoom, publicState, readRoom, PRESENCE_TIMEOUT_MS } from './engine.mjs';

class MemoryD1 {
  rows=new Map();
  prepare(sql){const rows=this.rows;let values=[];return {bind(...v){values=v;return this;},async first(){const row=rows.get(values[0]);if(!row)return null;if(sql.includes('expires_at>?')&&row.expires_at<=values[1])return null;return structuredClone(row);},async run(){if(sql.startsWith('INSERT')){const [code,host_token_hash,state_json,created_at,updated_at,expires_at]=values;const revision=0;if(rows.has(code))throw Error('UNIQUE');rows.set(code,{code,host_token_hash,guest_token_hash:null,state_json,revision,created_at,updated_at,expires_at});return {meta:{changes:1}};}const row=rows.get(values.at(-2));if(!row)return {meta:{changes:0}};if(sql.includes('SET host_token_hash=?')){const [host,guest,state,updated,code,revision]=values;if(row.revision!==revision)return {meta:{changes:0}};row.host_token_hash=host;row.guest_token_hash=guest;row.state_json=state;row.revision++;row.updated_at=updated;return {meta:{changes:1}};}if(sql.includes('guest_token_hash IS NULL')){const [guest_token_hash,state_json,updated_at,,revision]=values;if(row.revision!==revision||row.guest_token_hash)return {meta:{changes:0}};row.guest_token_hash=guest_token_hash;row.state_json=state_json;row.revision++;row.updated_at=updated_at;return {meta:{changes:1}};}const [state_json,updated_at,,revision]=values;if(row.revision!==revision)return {meta:{changes:0}};row.state_json=state_json;row.revision++;row.updated_at=updated_at;return {meta:{changes:1}};}};}
}
const optionsOf=scene=>scene.options;
const best=scene=>optionsOf(scene).toSorted((a,b)=>score(b.effect)-score(a.effect))[0];
const score=e=>Object.entries(e||{}).filter(([k])=>k!=='group').reduce((n,[,v])=>n+v,0)+(e?.group||0);
// Existing simulations exercise persisted legacy rooms; modern flow is tested below.
async function createPair(mode,prepare=true,modern=false,chooseVenue=true){const db=new MemoryD1(),host=await createRoom(db),guest=await joinRoom(db,host.code);await act(db,host.code,host.token,{type:'mode',mode});await act(db,host.code,host.token,{type:'ready',value:true});await act(db,host.code,guest.token,{type:'ready',value:true});if(mode==='coach'&&chooseVenue){const m=JSON.parse(db.rows.get(host.code).state_json).match;await act(db,host.code,host.token,{type:'chooseVenue',venueId:getProfile(mode,m.profileId).venuePreference});}if(!modern){const row=db.rows.get(host.code),saved=JSON.parse(row.state_json);saved.match.presentation=1;saved.match.personal=false;row.state_json=JSON.stringify(saved); }if(mode==='doubleDate'&&prepare){const pair=CONTENT.doubleDate.pairs[0];for(const [role,token]of [host.token,guest.token].entries()){await act(db,host.code,token,{type:'location',city:role?'Lyon':'Paris'});await act(db,host.code,token,{type:'likeProfile',profileId:pair.profiles[role]});await act(db,host.code,token,{type:'confirmMatch'});}await act(db,host.code,host.token,{type:'venue',venueId:'kebab'});await act(db,host.code,guest.token,{type:'venue',venueId:'kebab'});await act(db,host.code,host.token,{type:'confirmVenue'});await act(db,host.code,guest.token,{type:'confirmVenue'});}return {db,host,guest};}
async function identifyCorrect({db,host,guest},mode){const row=db.rows.get(host.code),room=JSON.parse(row.state_json),m=room.match;
 if(mode==='doubleDate'){
  for(let role=0;role<2;role++){const key=m.seats[role].find(x=>x.target).key;await act(db,host.code,role?guest.token:host.token,{type:'identify',key});}
 } else {const key=m.seats.find(x=>x.target).key;if(mode==='coach')await act(db,host.code,host.token,{type:'identify',key});else {await act(db,host.code,host.token,{type:'identify',key});await act(db,host.code,guest.token,{type:'identify',key});}}
}

test('content library has complete, unique, mode-exclusive authored scenarios',()=>{
 const ids=Object.values(CONTENT).flatMap(x=>x.profiles.map(p=>p.id));assert.equal(new Set(ids).size,ids.length);assert.equal(CONTENT.doubleDate.profiles.length,4);assert.equal(CONTENT.versus.profiles.length,4);assert.equal(CONTENT.coach.profiles.length,4);
 for(const pair of CONTENT.doubleDate.pairs){assert.equal(pair.rounds.length,5);assert(pair.profiles.every(id=>getProfile('doubleDate',id)));for(const sc of pair.rounds)assert(sc.options.length===3&&sc.options.every(o=>o.reply&&Object.keys(o.effect).length));}
 for(const p of CONTENT.versus.profiles)for(const sc of p.stories)assert(sc.prompt&&sc.options.length===3&&sc.options.every(o=>o.reply&&Object.keys(o.effect).length));
 for(const p of CONTENT.coach.profiles)for(const sc of p.scenes)assert(sc.prompt&&sc.options.length===3&&sc.options.every(o=>o.reply&&Object.keys(o.effect).length));
});

test('private projections keep Coach dossier away from the single player and hide secret answer keys',async()=>{
 for(const mode of ['coach','versus']){const match=await createPair(mode);const h=await readRoom(match.db,match.host.code,match.host.token),g=await readRoom(match.db,match.host.code,match.guest.token);const hostView=publicState(h.room,h.role),guestView=publicState(g.room,g.role);
  if(mode==='coach'){assert.equal(hostView.dossier,undefined);assert(guestView.dossier.bio);assert.equal(hostView.targetImage,undefined);assert.equal(guestView.profileId,undefined);assert(!JSON.stringify(guestView).includes('effect'));assert(!JSON.stringify(guestView).includes('options'));assert.equal(guestView.scene,null);assert.deepEqual(guestView.lastReveal,[]);assert.equal(hostView.scene,null);}
  else {assert.equal(hostView.dossier,undefined);assert.equal(hostView.profileId,undefined);assert(!JSON.stringify(hostView).includes('effect'));assert.equal(hostView.scene.options.length,3);}
 }
 const match=await createPair('versus');await identifyCorrect(match,'versus');const v=await readRoom(match.db,match.host.code,match.host.token);const scene=getProfile('versus',v.room.match.profileId).stories[0];await act(match.db,match.host.code,match.host.token,{type:'answer',option:scene.options[0].id});const pending=await readRoom(match.db,match.host.code,match.host.token);assert.equal(publicState(pending.room,0).revealed,null);assert.equal(publicState(pending.room,0).lastReveal,null);
});

test('full Double Date and Date à 3 matches resolve and reconnect through the room token',async()=>{
 for(const mode of ['doubleDate','versus']){const match=await createPair(mode);await identifyCorrect(match,mode);const room=JSON.parse(match.db.rows.get(match.host.code).state_json),m=room.match;const scenes=mode==='doubleDate'?getPair(m.kind).rounds:getProfile(mode,m.profileId).stories;
  for(let i=0;i<scenes.length;i++){const current=JSON.parse(match.db.rows.get(match.host.code).state_json);const view=publicState(current,0);const turn=view.scene?.turn||'simultaneous';if(mode==='versus'&&turn!=='simultaneous'){const actor=Number(turn.slice(-1)),actorView=publicState(current,actor),option=actorView.scene.options[0].id;await act(match.db,match.host.code,actor?match.guest.token:match.host.token,{type:'answer',option});}else{const opts=view.scene.options,first=opts[0].id,last=opts.at(-1).id;await act(match.db,match.host.code,match.host.token,{type:'answer',option:first});await act(match.db,match.host.code,match.guest.token,{type:'answer',option:mode==='versus'?last:first});}}
  const h=await act(match.db,match.host.code,match.host.token,{type:'heartbeat'});assert(h.ending);assert.equal((await readRoom(match.db,match.host.code,match.host.token)).role,0);assert.equal((await readRoom(match.db,match.host.code,match.guest.token)).role,1);
 }
});

test('Coach match uses asymmetric access and resolves all four authored scenes',async()=>{
 const match=await createPair('coach');await identifyCorrect(match,'coach');let row=match.db.rows.get(match.host.code),m=JSON.parse(row.state_json).match;const profile=getProfile('coach',m.profileId);const dossier=publicState(JSON.parse(row.state_json),1);assert(dossier.dossier.bio);assert.equal(dossier.scene,null);
 for(const sc of profile.scenes)await act(match.db,match.host.code,match.host.token,{type:'answer',option:best(sc).id});const done=await readRoom(match.db,match.host.code,match.host.token);assert(done.room.match.done);assert((await readRoom(match.db,match.host.code,match.guest.token)).room.match.done);
});

test('Coach revenge can invert roles and starts a different investigation',async()=>{
 const match=await createPair('coach');await identifyCorrect(match,'coach');const profileId=JSON.parse(match.db.rows.get(match.host.code).state_json).match.profileId;
 for(let i=0;i<getProfile('coach',JSON.parse(match.db.rows.get(match.host.code).state_json).match.profileId).scenes.length;i++){const view=publicState(JSON.parse(match.db.rows.get(match.host.code).state_json),0);await act(match.db,match.host.code,match.host.token,{type:'answer',option:view.scene.options[0].id});}
 const result=await readRoom(match.db,match.host.code,match.host.token);assert(result.room.match.done);await act(match.db,match.host.code,match.host.token,{type:'swapRoles'});await act(match.db,match.host.code,match.guest.token,{type:'swapRoles'});
 assert.equal((await readRoom(match.db,match.host.code,match.host.token)).role,1);assert.equal((await readRoom(match.db,match.host.code,match.guest.token)).role,0);
 await act(match.db,match.host.code,match.guest.token,{type:'ready',value:true});await act(match.db,match.host.code,match.host.token,{type:'ready',value:true});const next=JSON.parse(match.db.rows.get(match.host.code).state_json).match;assert.notEqual(next.profileId,profileId);
});

test('a prior answer unlocks its authored follow-up branch',()=>{
 const p=CONTENT.versus.profiles.find(p=>p.id==='vs-gabrielle');const room={phase:'playing',mode:'versus',players:[true,true],ready:[true,true],chat:[],match:{mode:'versus',profileId:p.id,round:2,picks:{},scores:[{connection:0,trust:0,respect:0},{connection:0,trust:0,respect:0}],memories:[{tag:'ignored-use'}],done:false,seats:[]}};
 const state=publicState(room,1);assert.match(state.scene.prompt,/L’un de vous a sauté la question des usages/);assert.equal(state.scene.options.length,3);
});

async function simulateVersus(policy,profileId='vs-gabrielle',difficulty='normal'){
 const match=await createPair('versus');const row=match.db.rows.get(match.host.code),room=JSON.parse(row.state_json),m=room.match;room.difficulty=difficulty;m.profileId=profileId;m.seats[0].target=true;for(const seat of m.seats.slice(1))seat.target=false;m.round=0;m.picks={};m.memories=[];m.scores=[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}];row.state_json=JSON.stringify(room);
 const key=m.seats[0].key;await act(match.db,match.host.code,match.host.token,{type:'identify',key});await act(match.db,match.host.code,match.guest.token,{type:'identify',key});
 for(let r=0;r<4;r++){
  const current=JSON.parse(row.state_json).match;const profile=getProfile('versus',current.profileId);const base=profile.stories[current.round];const branch=(NARRATIVE_BRANCHES[`${current.profileId}:${base.id}`]||[]).find(b=>current.memories.some(x=>x.tag===b.memory));const opts=branch?.options||base.options;
  const bestOption=opts.toSorted((a,b)=>score(b.effect)-score(a.effect))[0],worstOption=opts.toSorted((a,b)=>score(a.effect)-score(b.effect))[0];const roles=base.turn==='simultaneous'?[0,1]:[Number(base.turn.slice(-1))];for(const role of roles){const option=policy==='fail'||role===1?worstOption:bestOption;await act(match.db,match.host.code,role?match.guest.token:match.host.token,{type:'answer',option:option.id});}
 }
 return JSON.parse(row.state_json).match;
}

test('Date à 3 supports a coherent choice and a no-winner ending',async()=>{
 const win=await simulateVersus('win');assert(win.done);assert.equal(win.winner,0);assert.match(win.ending,/joueur 1/);
 const fail=await simulateVersus('fail');assert(fail.done);assert.equal(fail.winner,null);assert.match(fail.ending,/préfère rentrer seule/);
});

async function simulateDoubleDate(policy,pairId='dd-studio',difficulty='normal'){
 const match=await createPair('doubleDate'),row=match.db.rows.get(match.host.code),room=JSON.parse(row.state_json),m=room.match;room.difficulty=difficulty;m.kind=pairId;m.pair=getPair(pairId);m.seats=m.pair.profiles.map((id,role)=>{const target=getProfile('doubleDate',id);return CONTENT.doubleDate.profiles.map((p,i)=>({key:`seat-${role}-${i}`,image:`/portrait-${i}`,cue:p.face.cue,target:p.id===target.id}));});m.round=0;m.picks={};m.memories=[];m.group=0;m.scores=[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}];row.state_json=JSON.stringify(room);
 for(let role=0;role<2;role++){const key=m.seats[role].find(s=>s.target).key;await act(match.db,match.host.code,role?match.guest.token:match.host.token,{type:'identify',key});}
 for(let r=0;r<5;r++){
  const current=JSON.parse(row.state_json).match;const base=getPair(pairId).rounds[current.round];const branch=(NARRATIVE_BRANCHES[`${pairId}:${base.id}`]||[]).find(b=>current.memories.some(x=>x.tag===b.memory));const opts=branch?.options||base.options;const ordered=opts.toSorted((a,b)=>score(b.effect)-score(a.effect));const option=(policy==='win'?ordered[0]:ordered.at(-1)).id;await act(match.db,match.host.code,match.host.token,{type:'answer',option});await act(match.db,match.host.code,match.guest.token,{type:'answer',option});
 }
 return JSON.parse(row.state_json).match;
}

test('Double Date requires both partners and resolves good and bad team endings',async()=>{
 const win=await simulateDoubleDate('win');assert(win.done);assert.match(win.ending,/Les deux rendez-vous se prolongent/);assert.equal(win.scores.length,2);
 const fail=await simulateDoubleDate('fail');assert(fail.done);assert.match(fail.ending,/équipe échoue/);
});

test('Date à 3 enforces individual turns and gives the observer no answer controls',async()=>{
 const match=await createPair('versus');await identifyCorrect(match,'versus');let room=JSON.parse(match.db.rows.get(match.host.code).state_json);let profile=getProfile('versus',room.match.profileId);await act(match.db,match.host.code,match.host.token,{type:'answer',option:profile.stories[0].options[0].id});await act(match.db,match.host.code,match.guest.token,{type:'answer',option:profile.stories[0].options[1].id});
 room=JSON.parse(match.db.rows.get(match.host.code).state_json);const observer=publicState(room,1);assert.equal(observer.scene.turn,'player0');assert.equal(observer.scene.options.length,0);await assert.rejects(()=>act(match.db,match.host.code,match.guest.token,{type:'answer',option:profile.stories[1].options[0].id}),/s’adresse à l’autre prétendant/);
 await act(match.db,match.host.code,match.host.token,{type:'answer',option:profile.stories[1].options[0].id});room=JSON.parse(match.db.rows.get(match.host.code).state_json);assert.equal(room.match.round,2);assert.equal(room.match.lastReveal.length,1);
});

test('presence changes to disconnected and a heartbeat restores the same player token',async()=>{
 const match=await createPair('coach');const row=match.db.rows.get(match.host.code);let room=JSON.parse(row.state_json);room.lastSeen=[Date.now()-PRESENCE_TIMEOUT_MS-1000,Date.now()-PRESENCE_TIMEOUT_MS-1000];row.state_json=JSON.stringify(room);let state=publicState(room,0);assert.deepEqual(state.players,[false,false]);state=await act(match.db,match.host.code,match.host.token,{type:'heartbeat'});assert.deepEqual(state.players,[true,false]);assert.equal((await readRoom(match.db,match.host.code,match.host.token)).role,0);
});

async function simulateCoach(policy,profileId='coach-dounia',difficulty='normal'){
 const match=await createPair('coach'),row=match.db.rows.get(match.host.code),room=JSON.parse(row.state_json),m=room.match;room.difficulty=difficulty;m.profileId=profileId;m.round=0;m.picks={};m.memories=[];m.scores[0]={connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0};m.seats.forEach((seat,i)=>seat.target=i===0);row.state_json=JSON.stringify(room);await act(match.db,match.host.code,match.host.token,{type:'identify',key:m.seats[0].key});const profile=getProfile('coach',profileId);
 for(let i=0;i<profile.scenes.length;i++){const current=JSON.parse(row.state_json).match,scene=profile.scenes[current.round],branch=(NARRATIVE_BRANCHES[`${profileId}:${scene.id}`]||[]).find(b=>current.memories.some(x=>x.tag===b.memory)),opts=branch?.options||scene.options;const ordered=opts.toSorted((a,b)=>score(b.effect)-score(a.effect));await act(match.db,match.host.code,match.host.token,{type:'answer',option:(policy==='win'?ordered[0]:ordered.at(-1)).id});}
 return JSON.parse(row.state_json).match;
}
test('Coach investigation has a deduced success and a distinct failure ending',async()=>{
 const win=await simulateCoach('win');assert(win.done);assert.equal(win.winner,0);assert.match(win.ending,/propose un deuxième rendez-vous/);
 const fail=await simulateCoach('fail');assert(fail.done);assert.equal(fail.winner,null);assert.match(fail.ending,/vous remercie pour la soirée/);
});

test('all modes expose role-local identification without exposing the correct seat',async()=>{
 for(const mode of ['doubleDate','versus','coach']){
  const match=await createPair(mode);
  for(const role of [0,1]){
   const {room}=await readRoom(match.db,match.host.code,role?match.guest.token:match.host.token);
   const view=publicState(room,role);
   assert.equal(view.identifying,true);
   assert.equal(view.identified,false);
   if(mode==='coach'&&role===1){assert.equal(view.seats,null);continue;}
   assert.equal(view.seats.length,4);
   for(const seat of view.seats)assert.deepEqual(Object.keys(seat).sort(),['image','key']);
  }
  if(mode!=='coach'){
   const {room}=await readRoom(match.db,match.host.code,match.host.token);
   const seats=mode==='doubleDate'?room.match.seats[0]:room.match.seats;
   await act(match.db,match.host.code,match.host.token,{type:'identify',key:seats[0].key});
   const pending=(await readRoom(match.db,match.host.code,match.host.token)).room;
   assert.equal(publicState(pending,0).identified,true);
   assert.equal(publicState(pending,1).identified,false);
   assert.equal(publicState(pending,0).identifying,true);
  }else await identifyCorrect(match,mode);
 }
});

test('Double Date publishes resolved reactions but never the pending partner answer',async()=>{
 const match=await createPair('doubleDate');await identifyCorrect(match,'doubleDate');
 let {room}=await readRoom(match.db,match.host.code,match.host.token);
 const view=publicState(room,0),option=view.scene.options[0].id;
 assert.equal(view.identifying,false);assert.equal(view.seats,null);assert.equal(view.identified,true);
 await act(match.db,match.host.code,match.host.token,{type:'answer',option});
 room=(await readRoom(match.db,match.host.code,match.host.token)).room;
 assert.equal(publicState(room,1).lastReveal,null);assert.equal(publicState(room,1).revealed,null);
 await act(match.db,match.host.code,match.guest.token,{type:'answer',option});
 room=(await readRoom(match.db,match.host.code,match.host.token)).room;
 const revealed=publicState(room,0);assert.equal(revealed.lastReveal.length,2);
 assert(revealed.lastReveal.every(x=>x.reply&&x.text));assert(!JSON.stringify(revealed).includes('"effect"'));
});

test('a delayed answer cannot be applied to the next scene',async()=>{
 const match=await createPair('coach');await identifyCorrect(match,'coach');
 const {room}=await readRoom(match.db,match.host.code,match.host.token),view=publicState(room,0);
 const action={type:'answer',round:view.round,sceneId:view.scene.id,option:view.scene.options[0].id};
 await act(match.db,match.host.code,match.host.token,action);
 await assert.rejects(()=>act(match.db,match.host.code,match.host.token,action),/scène a changé/);
 assert.equal((await readRoom(match.db,match.host.code,match.host.token)).room.match.round,1);
});

test('either Coach player may request a swap and receives their actual new role',async()=>{
 for(const caller of [0,1]){
  const match=await createPair('coach');await identifyCorrect(match,'coach');
  for(let i=0;i<getProfile('coach',JSON.parse(match.db.rows.get(match.host.code).state_json).match.profileId).scenes.length;i++){
   const {room}=await readRoom(match.db,match.host.code,match.host.token),view=publicState(room,0);
   await act(match.db,match.host.code,match.host.token,{type:'answer',option:view.scene.options[0].id});
  }
  const token=caller?match.guest.token:match.host.token;
  const vote=await act(match.db,match.host.code,token,{type:'swapRoles'});assert.equal(vote.me,caller);assert.equal(vote.phase,'playing');
  await act(match.db,match.host.code,caller?match.host.token:match.guest.token,{type:'swapRoles'});
  assert.equal((await readRoom(match.db,match.host.code,token)).role,1-caller);
 }
});


test('both Double Date scenarios allow success and failure at every difficulty',async()=>{
 for(const pair of CONTENT.doubleDate.pairs)for(const difficulty of ['facile','normal','difficile']){
  const win=await simulateDoubleDate('win',pair.id,difficulty);
  assert.match(win.ending,/Les deux rendez-vous se prolongent/,`${pair.id}/${difficulty}: best authored answers must permit success`);
  const fail=await simulateDoubleDate('fail',pair.id,difficulty);
  assert.match(fail.ending,/équipe échoue/);
 }
});


test('every Versus and Coach profile supports success and failure at all difficulties',async()=>{
 for(const difficulty of ['facile','normal','difficile']){
  for(const profile of CONTENT.versus.profiles){
   const win=await simulateVersus('win',profile.id,difficulty);
   assert.equal(win.winner,0,`${profile.id}/${difficulty}`);
   assert.equal((await simulateVersus('fail',profile.id,difficulty)).winner,null);
  }
  for(const profile of CONTENT.coach.profiles){
   const win=await simulateCoach('win',profile.id,difficulty);
   assert.equal(win.winner,0,`${profile.id}/${difficulty}`);
   assert.equal((await simulateCoach('fail',profile.id,difficulty)).winner,null);
  }
 }
});


test('heartbeats skip redundant writes and real actions refresh presence',async()=>{
 const match=await createPair('coach'),row=match.db.rows.get(match.host.code);
 const revision=row.revision;
 await act(match.db,match.host.code,match.host.token,{type:'heartbeat'});
 await act(match.db,match.host.code,match.host.token,{type:'heartbeat'});
 assert.equal(row.revision,revision);
 let room=JSON.parse(row.state_json);room.lastSeen[0]=Date.now()-31000;row.state_json=JSON.stringify(room);
 await act(match.db,match.host.code,match.host.token,{type:'heartbeat'});assert.equal(row.revision,revision+1);
 room=JSON.parse(row.state_json);room.lastSeen[0]=Date.now()-31000;row.state_json=JSON.stringify(room);
 await act(match.db,match.host.code,match.host.token,{type:'chat',text:'Un indice'});
 assert(Date.now()-JSON.parse(row.state_json).lastSeen[0]<1000);
 assert.match(match.host.code,/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
});


test('Double Date keeps locations private and requires both likes and an agreed venue',async()=>{
 const match=await createPair('doubleDate',false),{db,host,guest}=match;
 let room=(await readRoom(db,host.code,host.token)).room;
 assert.equal(publicState(room,0).stage,'foxy');assert.equal(publicState(room,0).foxy.step,'location');
 assert.equal(publicState(room,0).scene,undefined);assert.equal(publicState(room,1).seats,undefined);
 await act(db,host.code,host.token,{type:'location',city:'Ville secrète du premier'});
 await act(db,host.code,guest.token,{type:'location',city:'Ville secrète du second'});
 room=(await readRoom(db,host.code,host.token)).room;
 const h=publicState(room,0),g=publicState(room,1);
 assert(!JSON.stringify(h).includes('Ville secrète du second'));assert(!JSON.stringify(g).includes('Ville secrète du premier'));
 assert(h.foxy.profiles.every(p=>!g.foxy.profiles.some(x=>x.id===p.id)));
 const pair=CONTENT.doubleDate.pairs[1];
 await act(db,host.code,host.token,{type:'likeProfile',profileId:pair.profiles[0]});
 assert.equal(publicState((await readRoom(db,host.code,host.token)).room,0).foxy.step,'waiting');
 await assert.rejects(()=>act(db,host.code,guest.token,{type:'likeProfile',profileId:CONTENT.doubleDate.pairs[0].profiles[1]}),/compatible/);
 await act(db,host.code,guest.token,{type:'likeProfile',profileId:pair.profiles[1]});
 assert.equal((await readRoom(db,host.code,host.token)).room.match.stage,'foxy');
 await assert.rejects(()=>act(db,host.code,host.token,{type:'venue',venueId:'kebab'}),/indisponible/);
 await act(db,host.code,host.token,{type:'confirmMatch'});
 assert.equal((await readRoom(db,host.code,host.token)).room.match.stage,'foxy');
 await act(db,host.code,guest.token,{type:'confirmMatch'});
 await act(db,host.code,host.token,{type:'venue',venueId:'kebab'});
 await act(db,host.code,guest.token,{type:'venue',venueId:'arcade'});
 assert.equal(publicState((await readRoom(db,host.code,host.token)).room,0).stage,'venue');
 await act(db,host.code,guest.token,{type:'venue',venueId:'kebab'});await act(db,host.code,host.token,{type:'confirmVenue'});await act(db,host.code,guest.token,{type:'confirmVenue'});
 room=(await readRoom(db,host.code,host.token)).room;
 assert.equal(room.match.venue.id,'kebab');assert.equal(room.match.kind,pair.id);
 assert.deepEqual(publicState(room,0).seats.map(s=>s.key),publicState(room,1).seats.map(s=>s.key)); // legacy shared tables remain compatible
 await identifyCorrect(match,'doubleDate');
 assert.equal((await readRoom(db,host.code,host.token)).room.match.stage,'conversation');
});

test('guest suggestions do not choose the mode and one rematch vote cannot reset a game',async()=>{
 const db=new MemoryD1(),host=await createRoom(db),guest=await joinRoom(db,host.code);
 const suggestion=await act(db,host.code,guest.token,{type:'suggestMode',mode:'coach'});
 assert.equal(suggestion.mode,null);assert.equal(suggestion.modeSuggestions[1],'coach');
 await assert.rejects(()=>act(db,host.code,guest.token,{type:'mode',mode:'coach'}),/impossible/);
 const match=await createPair('coach');await identifyCorrect(match,'coach');
 for(let i=0;i<getProfile('coach',JSON.parse(match.db.rows.get(match.host.code).state_json).match.profileId).scenes.length;i++){const v=publicState((await readRoom(match.db,match.host.code,match.host.token)).room,0);await act(match.db,match.host.code,match.host.token,{type:'answer',option:v.scene.options[0].id});}
 const initial=publicState((await readRoom(match.db,match.host.code,match.host.token)).room,0);
 const first=await act(match.db,match.host.code,match.host.token,{type:'continue'});
 assert.equal(first.phase,'playing');assert.equal(first.rematchVotes[0],'lobby');assert.equal(first.result.id,initial.result.id);
 const cancel=await act(match.db,match.host.code,match.host.token,{type:'continue',value:false});assert.equal(cancel.rematchVotes[0],null);
 await act(match.db,match.host.code,match.host.token,{type:'continue'});
 const second=await act(match.db,match.host.code,match.guest.token,{type:'continue'});
 assert.equal(second.phase,'lobby');assert.deepEqual(second.ready,[false,false]);assert.equal(second.participants[0].stats.games,1);
});


test('Coach deadlines are authoritative, charge once and survive reconnects',async()=>{
 const {db,host,guest}=await createPair('coach');await identifyCorrect({db,host,guest},'coach');
 let row=db.rows.get(host.code),room=JSON.parse(row.state_json);assert(room.match.deadline>Date.now());
 const firstRound=room.match.round;const initial=room.match.scores[0].connection;
 room.match.deadline=Date.now()-1;row.state_json=JSON.stringify(room);
 const [resumed,simultaneous]=await Promise.all([readRoom(db,host.code,guest.token),readRoom(db,host.code,host.token)]);assert.equal(simultaneous.room.match.timeoutCount,1);
 assert.equal(resumed.room.match.round,firstRound+1);assert.equal(resumed.room.match.scores[0].connection,initial-2);
 assert.equal(resumed.room.match.timeoutCount,1);
 await act(db,host.code,host.token,{type:'timeout',round:firstRound+1,sceneId:'old'});
 assert.equal((await readRoom(db,host.code,host.token)).room.match.timeoutCount,1);
 assert.equal(publicState(resumed.room,0).dossier,undefined);
 for(let i=0;i<8;i++){row=db.rows.get(host.code);room=JSON.parse(row.state_json);if(room.match.done)break;room.match.deadline=Date.now()-1;row.state_json=JSON.stringify(room);await readRoom(db,host.code,host.token);}
 room=(await readRoom(db,host.code,host.token)).room;assert(room.match.done);assert.equal(room.match.winner,null);assert.equal(room.participants[0].stats.games,1);
});

test('players rename in preparation while retaining their local identity',async()=>{
 const db=new MemoryD1(),host=await createRoom(db,'coach'),guest=await joinRoom(db,host.code);
 const before=(await readRoom(db,host.code,host.token)).room.participants[1].id;
 const renamed=await act(db,host.code,guest.token,{type:'rename',name:'Tony'});assert.equal(renamed.participants[1].name,'Tony');assert.equal(renamed.participants[1].id,before);
 await act(db,host.code,guest.token,{type:'ready',value:true});await assert.rejects(()=>act(db,host.code,guest.token,{type:'rename',name:'Autre'}),/préparer/);
});


test('room invitations expose the same fixed expiry to both devices',async()=>{
 const db=new MemoryD1(),before=Date.now(),host=await createRoom(db,'versus');
 const guest=await joinRoom(db,host.code);assert(host.expiresAt>=before+12*60*60*1000);assert.equal(guest.expiresAt,host.expiresAt);assert.equal(db.rows.get(host.code).expires_at,host.expiresAt);
});

async function modernDuo(ids,identify=true){
 const match=await createPair('doubleDate',false,true),{db,host,guest}=match;
 for(const [role,token] of [host.token,guest.token].entries()){
  await act(db,host.code,token,{type:'location',city:role?'Lyon':'Paris'});await act(db,host.code,token,{type:'likeProfile',profileId:ids[role]});await act(db,host.code,token,{type:'confirmMatch'});
 }
 for(const token of [host.token,guest.token])await act(db,host.code,token,{type:'venue',venueId:'luxury'});
 for(const token of [host.token,guest.token])await act(db,host.code,token,{type:'confirmVenue'});
 if(identify)await identifyCorrect(match,'doubleDate');return match;
}

test('modern Duo has four independently chosen profiles and four private candidates per device',async()=>{
 const {db,host,guest}=await createPair('doubleDate',false,true);
 let room=(await readRoom(db,host.code,host.token)).room;assert.equal(publicState(room,0).foxy.profiles.length,4);assert.equal(publicState(room,1).foxy.profiles.length,4);
 for(const token of [host.token,guest.token])await act(db,host.code,token,{type:'location',city:'Une ville'});
 await act(db,host.code,host.token,{type:'likeProfile',profileId:'dd-livia'});
 let other=publicState((await readRoom(db,host.code,guest.token)).room,1);assert.equal(other.foxy.profiles.length,3);assert(other.foxy.profiles.some(p=>p.id==='dd-iris'));assert(other.foxy.profiles.some(p=>p.id==='dd-solene'));
 await assert.rejects(()=>act(db,host.code,guest.token,{type:'likeProfile',profileId:'dd-livia'}),/ami/);
 await act(db,host.code,guest.token,{type:'likeProfile',profileId:'dd-iris'});
 for(const token of [host.token,guest.token])await act(db,host.code,token,{type:'confirmMatch'});
 for(const token of [host.token,guest.token])await act(db,host.code,token,{type:'venue',venueId:'luxury'});
 for(const token of [host.token,guest.token])await act(db,host.code,token,{type:'confirmVenue'});
 room=(await readRoom(db,host.code,host.token)).room;
 const h=publicState(room,0),g=publicState(room,1);assert.equal(h.seats.length,4);assert.equal(g.seats.length,4);assert(h.seats.every(s=>!g.seats.some(x=>x.key===s.key)));assert(!JSON.stringify(h.seats).includes('target'));assert.equal(h.profiles.length,1);assert.equal(g.profiles.length,1);
});

test('all personal Duo routes can win or fail; private dialogue and both reading barriers are enforced',async()=>{
 const profiles=CONTENT.doubleDate.profiles;
 for(const [index,p] of profiles.entries())for(const policy of ['win','fail']){
  const ids=[p.id,profiles[(index+3)%profiles.length].id],match=await modernDuo(ids),{db,host,guest}=match;
  for(let round=0;round<5;round++){
   const before=(await readRoom(db,host.code,host.token)).room;const h=publicState(before,0),g=publicState(before,1);assert.notEqual(h.scene.id,g.scene.id);assert.notEqual(h.scene.prompt,g.scene.prompt);
   const choose=role=>{const sc=getProfile('doubleDate',ids[role]).duoScenes[round];const options=sc.options.toSorted((a,b)=>score(b.effect)-score(a.effect));return policy==='win'?options[0]:options.at(-1);};
   const own=choose(0);await act(db,host.code,host.token,{type:'answer',option:own.id,round:round+1,sceneId:h.scene.id});
   let current=(await readRoom(db,host.code,host.token)).room;assert.equal(publicState(current,0).lastReveal[0].reply,own.reply);assert.deepEqual(publicState(current,1).lastReveal,[]);
   await act(db,host.code,host.token,{type:'nextScene',sceneId:h.scene.id});assert.equal((await readRoom(db,host.code,host.token)).room.match.round,round);
   await act(db,host.code,guest.token,{type:'answer',option:choose(1).id,round:round+1,sceneId:g.scene.id});
   current=(await readRoom(db,host.code,host.token)).room;assert.equal(publicState(current,0).lastReveal.length,1);assert.equal(current.match.round,round);
   await act(db,host.code,guest.token,{type:'nextScene',sceneId:g.scene.id});
   await assert.rejects(()=>act(db,host.code,host.token,{type:'nextScene',sceneId:h.scene.id}),/changé/);
  }
  const m=(await readRoom(db,host.code,host.token)).room.match;assert(m.done);assert.equal(m.successful,policy==='win');assert.equal(m.result.dates[0].length,policy==='win'?1:0);
 }
});

test('modern Coach receives a single reference profile, keeps the live scene private and pauses its deadline while the player reads',async()=>{
 const match=await createPair('coach',false,true),{db,host,guest}=match;
 let room=(await readRoom(db,host.code,host.token)).room;const coach=publicState(room,1),single=publicState(room,0);
 assert.equal(coach.seats,null);assert(coach.targetImage);assert.equal(single.targetImage,undefined);assert.equal(single.dossier,undefined);assert.equal(single.actor,undefined);assert.equal(single.seats.length,4);
 await identifyCorrect(match,'coach');room=(await readRoom(db,host.code,host.token)).room;
 const question=publicState(room,0);assert(question.actor.photo);assert(question.deadline>Date.now());
 const result=await act(db,host.code,host.token,{type:'answer',sceneId:question.scene.id,round:question.round,option:question.scene.options[0].id});
 assert(result.reaction);assert.equal(result.deadline,null);assert(result.lastReveal[0].reply);assert.equal(result.ending,null);
 await assert.rejects(()=>act(db,host.code,host.token,{type:'answer',option:question.scene.options[0].id}),/pas prêt/);
 const resumed=await act(db,host.code,host.token,{type:'nextScene',reactionId:result.reaction.id});assert.equal(resumed.reaction,null);assert(resumed.deadline>Date.now());const guide=publicState((await readRoom(db,host.code,guest.token)).room,1);assert.equal(guide.scene,null);assert.deepEqual(guide.lastReveal,[]);assert.equal(guide.reaction,null);assert.equal(guide.deadline,null);
});

test('modern Versus keeps simultaneous picks secret and requires both readers before resuming',async()=>{
 const match=await createPair('versus',false,true),{db,host,guest}=match;await identifyCorrect(match,'versus');
 const room=(await readRoom(db,host.code,host.token)).room,view=publicState(room,0);
 await act(db,host.code,host.token,{type:'answer',option:view.scene.options[0].id});assert.equal(publicState((await readRoom(db,host.code,guest.token)).room,1).lastReveal,null);
 const result=await act(db,host.code,guest.token,{type:'answer',option:view.scene.options[1].id});assert(result.reaction);assert.equal(result.lastReveal.length,2);
 await act(db,host.code,guest.token,{type:'nextScene',reactionId:result.reaction.id});assert(publicState((await readRoom(db,host.code,host.token)).room,0).reaction);
 await act(db,host.code,host.token,{type:'nextScene',reactionId:result.reaction.id});assert.equal(publicState((await readRoom(db,host.code,host.token)).room,0).reaction,null);
});

test('all four communication-only Coach routes finish with correct turn numbers and private profiles',async()=>{
 for(const p of CONTENT.coach.profiles)for(const policy of ['win','fail']){
  const match=await createPair('coach',false,true),{db,host}=match;const row=db.rows.get(host.code);let room=JSON.parse(row.state_json);room.match.profileId=p.id;room.match.seats=room.match.seats.map((seat,i)=>({...seat,target:i===0}));row.state_json=JSON.stringify(room);await identifyCorrect(match,'coach');
  for(let i=0;i<p.communicationScenes.length;i++){
   room=(await readRoom(db,host.code,host.token)).room;const view=publicState(room,0),guide=publicState(room,1);assert.equal(view.total,5);assert.equal(view.round,i+1);assert.equal(guide.scene,null);assert.deepEqual(guide.lastReveal,[]);assert.equal(guide.reaction,null);assert.equal(guide.dossier.values,undefined);assert.equal(guide.dossier.clues,undefined);
   const active=Object.values(NARRATIVE_BRANCHES).flat().find(b=>b.prompt===view.scene.prompt)||p.communicationScenes[i];const options=active.options.toSorted((a,b)=>score(b.effect)-score(a.effect));const result=await act(db,host.code,host.token,{type:'answer',round:view.round,sceneId:view.scene.id,option:(policy==='win'?options[0]:options.at(-1)).id});assert(result.reaction);assert.equal(result.deadline,null);
   await act(db,host.code,host.token,{type:'nextScene',reactionId:result.reaction.id});
  }
  room=(await readRoom(db,host.code,host.token)).room;assert(room.match.done);assert.equal(room.match.winner,policy==='win'?0:null);assert.equal(room.participants[0].stats.games,1);
 }
});

test('profile hints are not answer keys: appetite in the current conversation outweighs a dessert preference',()=>{
 const p=getProfile('coach','coach-dounia');assert(p.questions.some(q=>q.answer.includes('dessert')));assert(!p.interests.some(i=>/bowling/i.test(i)));
 const scene=p.communicationScenes.find(s=>s.id.endsWith('after-dinner'));assert(scene.prompt.includes('plus faim'));assert(scene.options.find(o=>o.id==='offer').effect.connection>0);assert(scene.options.find(o=>o.id==='rush').effect.connection<0);
});

test('each identification pack has one real person, two credible lookalikes and one absurd decoy',async()=>{
 for(const mode of ['doubleDate','coach','versus']){
  const match=mode==='doubleDate'?await modernDuo(['dd-livia','dd-iris'],false):await createPair(mode,false,true);const {db,host}=match;
  let room=(await readRoom(db,host.code,host.token)).room;
  for(const seats of mode==='doubleDate'?room.match.seats:[room.match.seats]){assert.equal(seats.filter(x=>x.target).length,1);assert.equal(seats.filter(x=>x.kind==='credible').length,2);assert.equal(seats.filter(x=>x.kind==='absurd').length,1);}
  for(const seat of publicState(room,0).seats){assert.match(seat.image,/\/people\/[a-f0-9]+\.webp$/);assert.equal(seat.target,undefined);assert.equal(seat.kind,undefined);}
  if(mode==='coach'){const hostView=JSON.stringify(publicState(room,0)),p=getProfile(mode,room.match.profileId);assert(!hostView.includes(p.bio));assert(!hostView.includes(p.media.photos[0]));assert.equal(publicState(room,1).scene,null);}
 }
});


test('Blind Foxy venue choice stays with the single player, keeps the dossier private and actually selects the destination',async()=>{
 const {db,host,guest}=await createPair('coach',false,true,false);
 const b=await readRoom(db,host.code,host.token),before=publicState(b.room,b.role),guide=publicState(b.room,1);
 assert.equal(before.stage,'venue');assert.equal(before.scene,null);assert.equal(before.seats,null);assert.equal(before.dossier,undefined);assert.equal(guide.scene,null);assert.equal(guide.deadline,null);assert(guide.dossier.bio);
 assert.equal(guide.dossier.venuePreference,undefined);
 await assert.rejects(()=>act(db,host.code,guest.token,{type:'chooseVenue',venueId:'kebab'}),/célibataire/);
 await assert.rejects(()=>act(db,host.code,host.token,{type:'chooseVenue',venueId:'missing'}),/Lieu indisponible/);
 const row=db.rows.get(host.code),room=JSON.parse(row.state_json);room.match.profileId='coach-katell';row.state_json=JSON.stringify(room);
 await act(db,host.code,host.token,{type:'chooseVenue',venueId:'kebab'});
 const m=JSON.parse(row.state_json).match;assert.equal(m.venue.id,'kebab');assert.equal(m.scores[0].connection,-1);
 const wrong=m.seats.find(s=>!s.target).key;
 const state=await act(db,host.code,host.token,{type:'identify',key:wrong});
 assert.equal(state.venue.id,'kebab');assert.match(state.arrivalNotice,/distributeur de serviettes/);assert.match(state.arrivalNotice,/quelqu’un/);
 assert(!/points|affinité|respect|−[0-9]/.test(state.arrivalNotice));assert.equal(state.actor.mood,'displeased');assert.equal(state.scores,undefined);
 const c=await readRoom(db,host.code,guest.token),coach=publicState(c.room,c.role);assert.equal(coach.actor,undefined);assert.equal(coach.arrivalNotice,undefined);assert.equal(coach.scene,null);
 await assert.rejects(()=>act(db,host.code,host.token,{type:'chooseVenue',venueId:'luxury'}),/célibataire/);
});
