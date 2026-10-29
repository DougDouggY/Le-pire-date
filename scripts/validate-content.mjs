import assert from 'node:assert/strict';
import { storyScenes, PREFERRED_VENUES } from '../server/romcom-content.mjs';
import { CONTENT, NARRATIVE_BRANCHES } from '../server/content.mjs';
import { existsSync } from 'node:fs';

const ids=[];
for(const [mode,pool] of Object.entries(CONTENT)){
 const profiles=pool.profiles;assert.equal(profiles.length,mode==='doubleDate'?8:4,`${mode}: complete profile library`);
 for(const p of profiles){assert(!/blue.pin|theat.*mask|masque/i.test(p.face.accessory),`${p.id}: no theatrical mask badge on clothing`);ids.push(p.id);assert(p.age>=18,`${p.id}: adult age required`);for(const field of ['name','job','bio','face','interests','values','sensitivities','history','clues','anecdote','secret'])assert(p[field],`${p.id}: missing ${field}`);}
 if(mode==='doubleDate'){
  assert.equal(pool.pairs.length,2);assert.equal(pool.duos.length,4);assert.equal(new Set(pool.duos.flatMap(d=>d.profiles)).size,8);for(const duo of pool.duos){assert.equal(duo.profiles.length,2);assert(duo.profiles.every(id=>profiles.some(p=>p.id===id)));assert.equal(duo.moments.length,6);}for(const p of profiles)validateScenes(p.id,p.duoScenes);
  for(const pair of pool.pairs){assert(pair.profiles.every(id=>profiles.some(p=>p.id===id)),`${pair.id}: foreign profile`);validateScenes(pair.id,pair.rounds);}
 } else for(const p of profiles){validateScenes(p.id,p.scenes||p.stories);if(mode==='versus'){assert.deepEqual(p.stories.map(s=>s.turn),['simultaneous','player0','player1','simultaneous'],`${p.id}: expected simultaneous, individual, reaction, decisive turns`);}}
 for(const p of profiles){assert.equal(p.media.photos.length,4);assert.equal(p.media.lookalikes.length,3);for(const path of [...p.media.photos,...p.media.lookalikes,...Object.values(p.media.actor)])assert(existsSync('public'+path),`${p.id}: missing ${path}`);assert.equal(p.questions.length,['dd-livia','dd-solene'].includes(p.id)?4:3);if(mode==='coach')validateScenes(p.id,p.communicationScenes);}
 for(let i=0;i<profiles.length;i++)assert(existsSync(`public/solo/assets/mp/${mode}-${i+1}.webp`),`${mode}: missing portrait ${i+1}`);
}
assert.equal(new Set(ids).size,ids.length,'mode profile ids must be globally unique');
function validateScenes(owner,scenes){assert(scenes?.length>=4,`${owner}: incomplete route`);const sceneIds=new Set();for(const sc of scenes){assert(sc.prompt,`${owner}/${sc.id}: missing prompt`);assert(!sceneIds.has(sc.id),`${owner}: duplicate scene id ${sc.id}`);sceneIds.add(sc.id);assert.equal(sc.options.length,3,`${owner}/${sc.id}: expected three authored answers`);const options=new Set();for(const o of sc.options){assert(!options.has(o.id),`${owner}/${sc.id}: duplicate option`);options.add(o.id);assert(o.text&&o.reply,`${owner}/${sc.id}/${o.id}: missing answer or reaction`);assert(Object.values(o.effect||{}).every(Number.isFinite),`${owner}/${sc.id}/${o.id}: invalid effect`);}}}
for(const [key,branches] of Object.entries(NARRATIVE_BRANCHES)){const [owner,sceneId]=key.split(':');let scenes;if(owner.startsWith('dd-'))scenes=CONTENT.doubleDate.pairs.find(p=>p.id===owner)?.rounds||CONTENT.doubleDate.profiles.find(p=>p.id===owner)?.duoScenes;else{const p=Object.values(CONTENT).flatMap(x=>x.profiles).find(p=>p.id===owner);scenes=p?.scenes||p?.stories;}assert(scenes?.some(s=>s.id===sceneId),`${key}: branch points to missing scene`);for(const branch of branches){const sceneIndex=scenes.findIndex(s=>s.id===sceneId);assert(scenes.slice(0,sceneIndex).some(s=>s.options.some(o=>o.memory===branch.memory)),`${key}: branch condition is unreachable`);assert(branch.prompt&&branch.options.length===3,`${key}: incomplete branch`);for(const o of branch.options)assert(o.text&&o.reply&&Object.keys(o.effect).length,`${key}: incomplete branch option`);}}
console.log(`Narrative validation passed: ${ids.length} exclusive profiles, ${Object.keys(NARRATIVE_BRANCHES).length} reachable branches.`);

let storyCount=0;
for(const [mode,pool] of Object.entries(CONTENT))for(const p of pool.profiles){
 const duo=mode==='doubleDate'?CONTENT.doubleDate.duos.find(d=>d.profiles.includes(p.id)):null;
 const match={mode,profileId:p.id,pair:duo?{profiles:[p.id,...duo.profiles.filter(id=>id!==p.id)]}:null,setup:duo?{pairId:duo.id}:null};
 const scenes=storyScenes(match,0);assert.equal(scenes.length,6);assert(['luxury','kebab','arcade'].includes(PREFERRED_VENUES[p.id]));validateScenes(p.id,scenes);storyCount+=scenes.length;
}
for(const asset of ['billiards-table','billiards-pool','marco-neutral','marco-amused','marco-skeptical'])assert(existsSync(`public/solo/assets/mp/${asset}.webp`));
console.log(`Modern narrative validation passed: ${storyCount} authored questions, three choices each, all venue and secondary-character assets present.`);
