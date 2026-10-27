import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTENT} from './content.mjs';
import {scenesFor} from './engine.mjs';
import {conversationScenes} from './conversation.mjs';

test('all twelve conversations open with an authored order and link every retained scene without replacing its choices',()=>{
 const ids=new Set();
 for(const [mode,pool]of Object.entries(CONTENT))for(const p of pool.profiles){
  const original=p.duoScenes||p.communicationScenes||p.stories;
  for(const venue of ['luxury','kebab','arcade']){
   const scenes=conversationScenes(p,original,venue);assert.equal(scenes.length,mode==='versus'?5:6);
   const welcome=scenes[0];assert.match(welcome.prompt,/boisson|boire|verre|thé|carte/);assert.equal(welcome.turn,'simultaneous');assert.equal(welcome.options.length,3);
   if(venue==='kebab')assert.match(welcome.prompt,/sauces/);if(venue==='arcade')assert.match(welcome.prompt,/bornes/);
   for(let i=1;i<scenes.length;i++){assert(scenes[i].transition?.length>35,`${p.id}: missing bridge ${i}`);assert.equal(scenes[i].id,original[i-1].id);assert.deepEqual(scenes[i].options,original[i-1].options);}
  }
  const welcome=conversationScenes(p,original)[0];assert(!ids.has(welcome.id));ids.add(welcome.id);assert(welcome.options.some(o=>o.effect.connection>0));assert(welcome.options.some(o=>o.effect.connection<0));
 }
 assert.equal(ids.size,12);
});


test('persisted rooms without the conversation version keep their exact turn count and scene identifiers',()=>{
 for(const [mode,pool]of Object.entries(CONTENT))for(const p of pool.profiles){
  const room={mode,presentation:2,personal:mode==='doubleDate',pair:{profiles:[p.id,p.id]},profileId:p.id};
  const original=p.duoScenes||p.communicationScenes||p.stories;
  assert.deepEqual(scenesFor(room).map(s=>s.id),original.map(s=>s.id));
  const modern=scenesFor({...room,conversation:1});assert.equal(modern.length,original.length+1);assert.equal(modern[0].id,`${p.id}-welcome`);
 }
});
