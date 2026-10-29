import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONTENT,publicProfile,coachDossier} from './content.mjs';

test('sixteen identities each have four profile photos, three expressions and three separate lookalikes',()=>{
 const all=new Set();let profiles=0;
 for(const pool of Object.values(CONTENT)){
  assert.equal(pool.profiles.length,pool===CONTENT.doubleDate?8:4);
  for(const p of pool.profiles){profiles++;const m=p.media;assert.equal(m.photos.length,4);assert.equal(m.lookalikes.length,3);assert.deepEqual(Object.keys(m.actor).sort(),['awkward','neutral','warm']);const files=[...m.photos,...m.lookalikes,...Object.values(m.actor)];assert.equal(new Set(files).size,10);
   for(const path of files){assert(!all.has(path),`${p.id}: image reused as another identity`);all.add(path);const bytes=readFileSync('public'+path);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
   assert.equal(p.questions.length,['dd-livia','dd-solene'].includes(p.id)?4:3);assert(p.questions.every(q=>q.question&&q.answer.length>20));
   const profile=publicProfile(p);assert.equal(profile.actor,undefined);assert.equal(profile.lookalikes,undefined);assert.equal(profile.media,undefined);
   if(p.mode==='coach'){const dossier=coachDossier(p);for(const field of ['scenes','communicationScenes','clues','values','sensitivities','secret','face'])assert.equal(dossier[field],undefined);}
  }
 }
 assert.equal(profiles,16);assert.equal(all.size,160);
});

test('retouched images replace legacy seat URLs and are byte-identical at their compatibility paths',async()=>{
 const {IMAGE_REVISIONS,revisedImage}=await import('./image-revisions.mjs');
 assert.equal(Object.keys(IMAGE_REVISIONS).length,13);
 for(const [old,current]of Object.entries(IMAGE_REVISIONS)){assert.notEqual(old,current);assert.equal(revisedImage(old),current);assert.deepEqual(readFileSync('public'+old),readFileSync('public'+current));}
 const solene=CONTENT.doubleDate.profiles.find(p=>p.id==='dd-solene');assert.equal(solene.face.accessory,'none');assert(!/broche|masque/i.test(solene.face.cue));
 for(const pool of Object.values(CONTENT))for(const p of pool.profiles)assert(!/blue.pin|theat.*mask|masque/i.test(p.face.accessory));
});
