import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT, NARRATIVE_BRANCHES, getProfile, getPair } from './content.mjs';
import { act, createRoom, joinRoom, publicState, readRoom } from './engine.mjs';

class MemoryD1 {
  rows=new Map();
  prepare(sql){const rows=this.rows;let values=[];return {bind(...v){values=v;return this;},async first(){const row=rows.get(values[0]);if(!row)return null;if(sql.includes('expires_at>?')&&row.expires_at<=values[1])return null;return structuredClone(row);},async run(){if(sql.startsWith('INSERT')){const [code,host_token_hash,state_json,revision,created_at,updated_at,expires_at]=values;if(rows.has(code))throw Error('UNIQUE');rows.set(code,{code,host_token_hash,guest_token_hash:null,state_json,revision,created_at,updated_at,expires_at});return {meta:{changes:1}};}const row=rows.get(values.at(-2));if(!row)return {meta:{changes:0}};if(sql.includes('SET host_token_hash=?')){const [host,guest,state,updated,code,revision]=values;if(row.revision!==revision)return {meta:{changes:0}};row.host_token_hash=host;row.guest_token_hash=guest;row.state_json=state;row.revision++;row.updated_at=updated;return {meta:{changes:1}};}if(sql.includes('guest_token_hash IS NULL')){const [guest_token_hash,state_json,updated_at,,revision]=values;if(row.revision!==revision||row.guest_token_hash)return {meta:{changes:0}};row.guest_token_hash=guest_token_hash;row.state_json=state_json;row.revision++;row.updated_at=updated_at;return {meta:{changes:1}};}const [state_json,updated_at,,revision]=values;if(row.revision!==revision)return {meta:{changes:0}};row.state_json=state_json;row.revision++;row.updated_at=updated_at;return {meta:{changes:1}};}};}
}
const optionsOf=scene=>scene.options;
const best=scene=>optionsOf(scene).toSorted((a,b)=>score(b.effect)-score(a.effect))[0];
const score=e=>Object.entries(e||{}).filter(([k])=>k!=='group').reduce((n,[,v])=>n+v,0)+(e?.group||0);
async function createPair(mode){const db=new MemoryD1(),host=await createRoom(db),guest=await joinRoom(db,host.code);await act(db,host.code,host.token,{type:'mode',mode});await act(db,host.code,host.token,{type:'ready',value:true});await act(db,host.code,guest.token,{type:'ready',value:true});return {db,host,guest};}
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
  if(mode==='coach'){assert.equal(hostView.dossier,undefined);assert(guestView.dossier);assert.equal(hostView.targetImage,undefined);assert.equal(guestView.profileId,undefined);assert(!JSON.stringify(guestView).includes('effect'));assert(!JSON.stringify(guestView).includes('options'));assert(hostView.scene.options.length===3);}
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
 const match=await createPair('coach');await identifyCorrect(match,'coach');let row=match.db.rows.get(match.host.code),m=JSON.parse(row.state_json).match;const profile=getProfile('coach',m.profileId);const dossier=publicState(JSON.parse(row.state_json),1);assert(dossier.dossier.secret);assert.equal(dossier.scene.options,undefined);
 for(const sc of profile.scenes)await act(match.db,match.host.code,match.host.token,{type:'answer',option:best(sc).id});const done=await readRoom(match.db,match.host.code,match.host.token);assert(done.room.match.done);assert((await readRoom(match.db,match.host.code,match.guest.token)).room.match.done);
});

test('Coach revenge can invert roles and starts a different investigation',async()=>{
 const match=await createPair('coach');await identifyCorrect(match,'coach');const profileId=JSON.parse(match.db.rows.get(match.host.code).state_json).match.profileId;
 for(let i=0;i<4;i++){const view=publicState(JSON.parse(match.db.rows.get(match.host.code).state_json),0);await act(match.db,match.host.code,match.host.token,{type:'answer',option:view.scene.options[0].id});}
 const result=await readRoom(match.db,match.host.code,match.host.token);assert(result.room.match.done);await act(match.db,match.host.code,match.host.token,{type:'swapRoles'});
 assert.equal((await readRoom(match.db,match.host.code,match.host.token)).role,1);assert.equal((await readRoom(match.db,match.host.code,match.guest.token)).role,0);
 await act(match.db,match.host.code,match.guest.token,{type:'ready',value:true});await act(match.db,match.host.code,match.host.token,{type:'ready',value:true});const next=JSON.parse(match.db.rows.get(match.host.code).state_json).match;assert.notEqual(next.profileId,profileId);
});

test('a prior answer unlocks its authored follow-up branch',()=>{
 const p=CONTENT.versus.profiles.find(p=>p.id==='vs-gabrielle');const room={phase:'playing',mode:'versus',players:[true,true],ready:[true,true],chat:[],match:{mode:'versus',profileId:p.id,round:2,picks:{},scores:[{connection:0,trust:0,respect:0},{connection:0,trust:0,respect:0}],memories:[{tag:'ignored-use'}],done:false,seats:[]}};
 const state=publicState(room,1);assert.match(state.scene.prompt,/L’un de vous a sauté la question des usages/);assert.equal(state.scene.options.length,3);
});

async function simulateVersus(policy){
 const match=await createPair('versus');const row=match.db.rows.get(match.host.code),room=JSON.parse(row.state_json),m=room.match;m.profileId='vs-gabrielle';m.seats[0].target=true;for(const seat of m.seats.slice(1))seat.target=false;m.round=0;m.picks={};m.memories=[];m.scores=[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}];row.state_json=JSON.stringify(room);
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

async function simulateDoubleDate(policy){
 const match=await createPair('doubleDate'),row=match.db.rows.get(match.host.code),room=JSON.parse(row.state_json),m=room.match;m.kind='dd-studio';m.pair=getPair('dd-studio');m.seats=m.pair.profiles.map((id,role)=>{const target=getProfile('doubleDate',id);return CONTENT.doubleDate.profiles.map((p,i)=>({key:`seat-${role}-${i}`,image:`/portrait-${i}`,cue:p.face.cue,target:p.id===target.id}));});m.round=0;m.picks={};m.memories=[];m.group=0;m.scores=[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}];row.state_json=JSON.stringify(room);
 for(let role=0;role<2;role++){const key=m.seats[role].find(s=>s.target).key;await act(match.db,match.host.code,role?match.guest.token:match.host.token,{type:'identify',key});}
 for(let r=0;r<5;r++){
  const current=JSON.parse(row.state_json).match;const base=getPair('dd-studio').rounds[current.round];const branch=(NARRATIVE_BRANCHES[`dd-studio:${base.id}`]||[]).find(b=>current.memories.some(x=>x.tag===b.memory));const opts=branch?.options||base.options;const ordered=opts.toSorted((a,b)=>score(b.effect)-score(a.effect));const option=(policy==='win'?ordered[0]:ordered.at(-1)).id;await act(match.db,match.host.code,match.host.token,{type:'answer',option});await act(match.db,match.host.code,match.guest.token,{type:'answer',option});
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
 const match=await createPair('coach');const row=match.db.rows.get(match.host.code);let room=JSON.parse(row.state_json);room.lastSeen=[Date.now()-30000,Date.now()-30000];row.state_json=JSON.stringify(room);let state=publicState(room,0);assert.deepEqual(state.players,[false,false]);state=await act(match.db,match.host.code,match.host.token,{type:'heartbeat'});assert.deepEqual(state.players,[true,false]);assert.equal((await readRoom(match.db,match.host.code,match.host.token)).role,0);
});

async function simulateCoach(policy){
 const match=await createPair('coach'),row=match.db.rows.get(match.host.code),room=JSON.parse(row.state_json),m=room.match;m.profileId='coach-dounia';m.round=0;m.picks={};m.memories=[];m.scores[0]={connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0};m.seats.forEach((seat,i)=>seat.target=i===0);row.state_json=JSON.stringify(room);await act(match.db,match.host.code,match.host.token,{type:'identify',key:m.seats[0].key});const profile=getProfile('coach','coach-dounia');
 for(let i=0;i<profile.scenes.length;i++){const current=JSON.parse(row.state_json).match,scene=profile.scenes[current.round],branch=(NARRATIVE_BRANCHES[`coach-dounia:${scene.id}`]||[]).find(b=>current.memories.some(x=>x.tag===b.memory)),opts=branch?.options||scene.options;const ordered=opts.toSorted((a,b)=>score(b.effect)-score(a.effect));await act(match.db,match.host.code,match.host.token,{type:'answer',option:(policy==='win'?ordered[0]:ordered.at(-1)).id});}
 return JSON.parse(row.state_json).match;
}
test('Coach investigation has a deduced success and a distinct failure ending',async()=>{
 const win=await simulateCoach('win');assert(win.done);assert.equal(win.winner,0);assert.match(win.ending,/propose un deuxième rendez-vous/);
 const fail=await simulateCoach('fail');assert(fail.done);assert.equal(fail.winner,null);assert.match(fail.ending,/vous remercie pour la soirée/);
});
