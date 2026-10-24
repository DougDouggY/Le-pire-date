import assert from 'node:assert/strict';
import { CONTENT, NARRATIVE_BRANCHES } from '../server/content.mjs';
import { existsSync } from 'node:fs';

const ids=[];
for(const [mode,pool] of Object.entries(CONTENT)){
 const profiles=pool.profiles;assert.equal(profiles.length,4,`${mode}: expected a complete first batch of four`);
 for(const p of profiles){ids.push(p.id);assert(p.age>=18,`${p.id}: adult age required`);for(const field of ['name','job','bio','face','interests','values','sensitivities','history','clues','anecdote','secret'])assert(p[field],`${p.id}: missing ${field}`);}
 if(mode==='doubleDate'){
  assert.equal(pool.pairs.length,2);
  for(const pair of pool.pairs){assert(pair.profiles.every(id=>profiles.some(p=>p.id===id)),`${pair.id}: foreign profile`);validateScenes(pair.id,pair.rounds);}
 } else for(const p of profiles){validateScenes(p.id,p.scenes||p.stories);if(mode==='versus'){assert.deepEqual(p.stories.map(s=>s.turn),['simultaneous','player0','player1','simultaneous'],`${p.id}: expected simultaneous, individual, reaction, decisive turns`);}}
 for(let i=0;i<profiles.length;i++)assert(existsSync(`public/solo/assets/mp/${mode}-${i+1}.webp`),`${mode}: missing portrait ${i+1}`);
}
assert.equal(new Set(ids).size,ids.length,'mode profile ids must be globally unique');
function validateScenes(owner,scenes){assert(scenes?.length>=4,`${owner}: incomplete route`);const sceneIds=new Set();for(const sc of scenes){assert(sc.prompt,`${owner}/${sc.id}: missing prompt`);assert(!sceneIds.has(sc.id),`${owner}: duplicate scene id ${sc.id}`);sceneIds.add(sc.id);assert.equal(sc.options.length,3,`${owner}/${sc.id}: expected three authored answers`);const options=new Set();for(const o of sc.options){assert(!options.has(o.id),`${owner}/${sc.id}: duplicate option`);options.add(o.id);assert(o.text&&o.reply,`${owner}/${sc.id}/${o.id}: missing answer or reaction`);assert(Object.values(o.effect||{}).every(Number.isFinite),`${owner}/${sc.id}/${o.id}: invalid effect`);}}}
for(const [key,branches] of Object.entries(NARRATIVE_BRANCHES)){const [owner,sceneId]=key.split(':');let scenes;if(owner.startsWith('dd-'))scenes=CONTENT.doubleDate.pairs.find(p=>p.id===owner)?.rounds;else{const p=Object.values(CONTENT).flatMap(x=>x.profiles).find(p=>p.id===owner);scenes=p?.scenes||p?.stories;}assert(scenes?.some(s=>s.id===sceneId),`${key}: branch points to missing scene`);for(const branch of branches){const sceneIndex=scenes.findIndex(s=>s.id===sceneId);assert(scenes.slice(0,sceneIndex).some(s=>s.options.some(o=>o.memory===branch.memory)),`${key}: branch condition is unreachable`);assert(branch.prompt&&branch.options.length===3,`${key}: incomplete branch`);for(const o of branch.options)assert(o.text&&o.reply&&Object.keys(o.effect).length,`${key}: incomplete branch option`);}}
console.log(`Narrative validation passed: ${ids.length} exclusive profiles, ${Object.keys(NARRATIVE_BRANCHES).length} reachable branches.`);
