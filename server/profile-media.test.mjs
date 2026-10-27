import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONTENT,publicProfile,coachDossier} from './content.mjs';

test('twelve identities each have four profile photos, three expressions and three separate lookalikes',()=>{
 const all=new Set();let profiles=0;
 for(const pool of Object.values(CONTENT)){
  assert.equal(pool.profiles.length,4);
  for(const p of pool.profiles){profiles++;const m=p.media;assert.equal(m.photos.length,4);assert.equal(m.lookalikes.length,3);assert.deepEqual(Object.keys(m.actor).sort(),['awkward','neutral','warm']);const files=[...m.photos,...m.lookalikes,...Object.values(m.actor)];assert.equal(new Set(files).size,10);
   for(const path of files){assert(!all.has(path),`${p.id}: image reused as another identity`);all.add(path);const bytes=readFileSync('public'+path);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
   assert.equal(p.questions.length,3);assert(p.questions.every(q=>q.question&&q.answer.length>20));
   const profile=publicProfile(p);assert.equal(profile.actor,undefined);assert.equal(profile.lookalikes,undefined);assert.equal(profile.media,undefined);
   if(p.mode==='coach'){const dossier=coachDossier(p);for(const field of ['scenes','communicationScenes','clues','values','sensitivities','secret','face'])assert.equal(dossier[field],undefined);}
  }
 }
 assert.equal(profiles,12);assert.equal(all.size,120);
});
