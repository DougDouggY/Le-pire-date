import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { MemoryD1 } from './test-memory-db.mjs';
import { CONTENT, getProfile } from './content.mjs';
import { createRoom,joinRoom,act,readRoom,publicState } from './engine.mjs';
import { storyScene,storyScenes } from './romcom-engine.mjs';
import { PREFERRED_VENUES } from './romcom-content.mjs';
const value=o=>Object.values(o.effect).reduce((n,x)=>n+x,0);
async function fixture(mode='doubleDate',id='duo-studio',reverse=false,proposal=null){
 const db=new MemoryD1(),host=await createRoom(db,mode,{name:'Alex'}),guest=await joinRoom(db,host.code,{name:'Tony'}),tokens=[host.token,guest.token];
 const room=()=>JSON.parse(db.rows.get(host.code).state_json),view=r=>publicState(room(),r),send=(r,a)=>act(db,host.code,tokens[r],a);
 await send(0,{type:'ready',value:true});await send(1,{type:'ready',value:true});
 if(mode==='doubleDate'){
  const d=CONTENT.doubleDate.duos.find(d=>d.id===id),ids=reverse?d.profiles.toReversed():d.profiles;
  for(let r=0;r<2;r++){await send(r,{type:'location',city:'Paris'});await send(r,{type:'likeProfile',profileId:ids[r]});await send(r,{type:'confirmMatch'});}
  const venue=proposal||PREFERRED_VENUES[ids[0]];
  for(let r=0;r<2;r++){await send(r,{type:'venue',venueId:venue});await send(r,{type:'confirmVenue'});}
 }else{
  const row=db.rows.get(host.code),saved=room();saved.match.profileId=id;row.state_json=JSON.stringify(saved);
  const venue=proposal||PREFERRED_VENUES[id];
  if(mode==='coach')await send(0,{type:'chooseVenue',venueId:venue});else for(let r=0;r<2;r++){await send(r,{type:'venue',venueId:venue});await send(r,{type:'confirmVenue'});}
 }
 return {db,host,guest,room,view,send,tokens};
}
async function arrive(f,wrong=false){
 const id=f.view(0).invitation.id;await f.send(0,{type:'ackInvitation',invitationId:id});
 if(f.room().mode!=='coach'){assert.equal(f.view(0).stage,'invitation');await f.send(1,{type:'ackInvitation',invitationId:id});}
 const m=f.room().match;for(const r of m.mode==='coach'?[0]:[0,1]){const seats=m.mode==='doubleDate'?m.seats[r]:m.seats;await f.send(r,{type:'identify',key:seats.find(x=>x.target!==wrong).key});}
 await drain(f);
}
async function drain(f){let safety=100;while(f.room().match.playback&&safety--){const id=f.view(0).reaction.id;const index=f.room().match.playback.index;await f.send(0,{type:'nextScene',reactionId:id});if(f.room().mode!=='coach'){assert.equal(f.room().match.playback.index,index);await f.send(1,{type:'nextScene',reactionId:id});}}assert(safety>0);}
async function answerRound(f,policies=['best','best']){
 const before=f.room(),m=before.match,roles=m.mode==='coach'?[0]:[0,1].filter(r=>storyScene(before,r).active);
 for(const [i,r]of roles.entries()){
  const s=storyScene(f.room(),r),options=[...s.options].sort((a,b)=>value(b)-value(a));const o=policies[r]==='best'?options[0]:options.at(-1),v=f.view(r);
  await f.send(r,{type:'answer',round:v.round,sceneId:v.scene.id,option:o.id});
  if(i===0&&roles.length===2){const pending=f.view(1-r);assert.deepEqual(pending.lastReveal,[]);assert.equal(pending.reaction,null);const {scene:pendingScene,...safe}=pending;void pendingScene;assert(!JSON.stringify(safe).includes(o.id),'pending option leaks');assert.equal(f.room().match.scores[r].connection,m.scores[r].connection,'effect applied before joint commit');}
 }
 await drain(f);
}
test('new venue invitations redirect without penalty, award only correct proposals and reach both phones',async()=>{
 for(const d of CONTENT.doubleDate.duos)for(const proposed of ['luxury','kebab','arcade']){
  const f=await fixture('doubleDate',d.id,false,proposed),m=f.room().match;assert.equal(m.venue.id,PREFERRED_VENUES[d.profiles[0]]);
  assert.equal(m.scores[0].connection,proposed===m.venue.id?1:0);assert.deepEqual(f.view(0).invitation.messages,f.view(1).invitation.messages);
  assert.equal(f.view(0).scene,null);assert(!JSON.stringify(f.view(0)).includes('PREFERRED_VENUES'));await arrive(f);
 }
 for(const mode of ['coach','versus'])for(const p of CONTENT[mode].profiles){const f=await fixture(mode,p.id,false,'kebab');assert.equal(f.room().match.venue.id,PREFERRED_VENUES[p.id]);await arrive(f);}
});
test('all modern routes complete with independent outcomes and private two-phase testimony at every difficulty',async()=>{
 for(const mode of ['doubleDate','coach','versus'])for(const id of mode==='doubleDate'?CONTENT[mode].duos.map(x=>x.id):CONTENT[mode].profiles.map(x=>x.id))for(const difficulty of ['facile','normal','difficile'])for(const policy of ['best','worst']){
  const f=await fixture(mode,id);const row=f.db.rows.get(f.host.code),room=f.room();room.difficulty=difficulty;row.state_json=JSON.stringify(room);await arrive(f);
  let safety=20;while(!f.room().match.done&&safety--)await answerRound(f,[policy,mode==='versus'?'worst':policy]);assert(safety>0,`${mode}/${id}: stalled`);
  const m=f.room().match;assert.equal(m.round,6);assert(m.result);assert.equal(f.room().participants[0].stats.games,1);
  if(mode==='doubleDate'){assert.equal(m.individual.length,2);assert(m.individual.every(x=>x===(policy==='best'?'interested':'apart')),`${id}/${difficulty}/${policy}`);}
  if(mode==='coach')assert.equal(m.winner,policy==='best'?0:null);
  if(mode==='versus')assert.equal(m.winner,policy==='best'?0:null);
  await f.send(0,{type:'heartbeat'});assert.equal(f.room().participants[0].stats.games,1);
 }
});
test('validated opening choices depend on the candidate, and synchronized playback survives reconnect and stale clicks',async()=>{
 for(const reverse of [false,true]){
  const f=await fixture('doubleDate','duo-studio',reverse);await arrive(f);const first=f.view(0),option=first.scene.options[0];
  await f.send(0,{type:'answer',round:first.round,sceneId:first.scene.id,option:option.id});
  const reconnect=await readRoom(f.db,f.host.code,f.guest.token);assert.equal(publicState(reconnect.room,1).reaction,null);assert.deepEqual(publicState(reconnect.room,1).lastReveal,[]);
  const second=f.view(1);await f.send(1,{type:'answer',round:second.round,sceneId:second.scene.id,option:second.scene.options[1].id});
  const playback=f.room().match.playback;assert.equal(playback.beats[0].speaker,'Alex');assert.equal(playback.beats[2].speaker,'Tony');
  const id=f.view(0).reaction.id;await f.send(0,{type:'nextScene',reactionId:id});await f.send(1,{type:'nextScene',reactionId:id});await assert.rejects(()=>f.send(0,{type:'nextScene',reactionId:id}),/changé/);await drain(f);
  await assert.rejects(()=>f.send(0,{type:'answer',round:first.round,sceneId:first.scene.id,option:option.id}),/changé/);
 }
});
test('conditional secondary actor and physical action exist only for the selected validated branch',async()=>{
 for(const choices of [[1,0],[2,2],[0,1]]){
  const f=await fixture();await arrive(f);await answerRound(f);
  for(let r=0;r<2;r++){const v=f.view(r);await f.send(r,{type:'answer',round:v.round,sceneId:v.scene.id,option:v.scene.options[choices[r]].id});}
  const beats=f.room().match.playback.beats;assert.equal(beats.some(b=>b.profileId==='marco'),choices[0]===2);assert.equal(beats.some(b=>b.animation==='cheat'),choices[1]===2);
  for(const b of beats)if(b.profileId==='marco')assert.equal(b.space,'table');
  await drain(f);while(!f.room().match.done)await answerRound(f);
  if(choices[0]===1){assert(f.room().match.memories.some(m=>m.tag==='livia-small-lie'));assert(!f.room().match.memories.some(m=>m.tag==='livia-exposed'));}
 }
});
test('Coach privacy includes playback and invitation, timeout is charged once then waits for reading',async()=>{
 const f=await fixture('coach','coach-dounia');assert.equal(f.view(1).invitation,undefined);await arrive(f);
 const row=f.db.rows.get(f.host.code),room=f.room();room.match.deadline=Date.now()-1;row.state_json=JSON.stringify(room);
 await Promise.all(f.tokens.map(t=>readRoom(f.db,f.host.code,t)));assert.equal(f.room().match.timeoutCount,1);assert.equal(f.room().match.deadline,null);
 const coach=f.view(1);for(const field of ['actor','animation','backdrop','invitation'])assert.equal(coach[field],undefined);assert.deepEqual(coach.lastReveal,[]);assert.equal(coach.scene,null);assert.equal(coach.deadline,null);
 const single=JSON.stringify(f.view(0));assert(!single.includes(getProfile('coach','coach-dounia').bio));assert(!single.includes('effect'));await drain(f);assert.equal(f.room().match.round,1);assert(f.room().match.deadline>Date.now());
});
test('new story portraits and backgrounds exist and private route metadata is never projected',async()=>{
 for(const file of ['billiards-table','billiards-pool','marco-neutral','marco-amused','marco-skeptical'])assert(existsSync(`public/solo/assets/mp/${file}.webp`));
 for(const mode of ['doubleDate','coach','versus']){const id=mode==='doubleDate'?'duo-studio':CONTENT[mode].profiles[0].id,f=await fixture(mode,id);await arrive(f);for(const r of [0,1]){const text=JSON.stringify(f.view(r));assert(!/"(effect|memory|cross|rival|event|storyPicks|scores|history)"/.test(text));}assert.equal(storyScenes(f.room().match,0).length,6);}
});
test('mixed Duo outcomes unlock only the successful personal contact, including mirrored seats',async()=>{
 for(const duo of CONTENT.doubleDate.duos)for(const reverse of [false,true]){
  const f=await fixture('doubleDate',duo.id,reverse);await arrive(f);while(!f.room().match.done)await answerRound(f,['best','worst']);
  const m=f.room().match;assert.equal(m.individual[0],'interested');assert.equal(m.individual[1],'apart');assert.equal(m.result.dates[0].length,1);assert.equal(m.result.dates[1].length,0);assert.deepEqual(m.result.outcomes,['win','loss']);
  assert.equal(f.room().participants[0].stats.wins,1);assert.equal(f.room().participants[1].stats.losses,1);
 }
});
test('each Versus candidate can choose the guest, and an inactive player cannot answer the crossed turn',async()=>{
 for(const p of CONTENT.versus.profiles){const f=await fixture('versus',p.id);await arrive(f);while(!f.room().match.done){
  const room=f.room(),inactive=[0,1].find(r=>!storyScene(room,r).active);if(inactive!==undefined){const s=storyScene(room,1-inactive);await assert.rejects(()=>f.send(inactive,{type:'answer',round:room.match.round+1,sceneId:s.id,option:s.options[0].id}),/ami/);}
  await answerRound(f,['worst','best']);
 }assert.equal(f.room().match.winner,1);assert.equal(f.room().match.result.dates[0].length,0);assert.equal(f.room().match.result.dates[1].length,1);}
});
