import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moodFor,arrivalFor,SPRITES} from './date-presentation.mjs';
import {CONTENT,coachDossier} from './content.mjs';

test('cumulative mood has six faces; one wrong answer does not erase two good answers',()=>{
 const score=(connection,trust=0,respect=0)=>({connection,trust,respect});
 assert.deepEqual([-7,-4,-1,0,3,8].map(n=>moodFor(score(n))),['angry','disappointed','displeased','neutral','happy','delighted']);
 const happy=score(4,2,2);assert.equal(moodFor(happy),'happy');
 happy.connection-=1;happy.trust-=1;assert.equal(moodFor(happy),'happy');
 assert.equal(moodFor(score(0)),'neutral');
});

test('every multiplayer woman has six distinct transparent sprites without changing the lookalike reference',()=>{
 const paths=new Set();
 for(const pool of Object.values(CONTENT))for(const p of pool.profiles){
  const sprites=SPRITES[p.id];assert(sprites,p.id);
  assert.deepEqual(Object.keys(sprites).sort(),['angry','delighted','disappointed','displeased','happy','neutral']);
  for(const path of Object.values(sprites)){
   assert(!paths.has(path));paths.add(path);const bytes=readFileSync('public'+path);
   assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert(bytes.includes(Buffer.from('ALPH')),`${path}: sprite has no alpha channel`);
  }
  assert(!Object.values(sprites).includes(p.media.actor.neutral),'Do not substitute the identification reference with a new sprite');
 }
 assert.equal(paths.size,72);
});

test('all Blind Foxy venue preferences have natural clues, distinct arrival remarks and no public answer key',()=>{
 for(const p of CONTENT.coach.profiles){
  const dossier=coachDossier(p);assert(dossier.bio.length>120);assert.equal(dossier.venuePreference,undefined);
  const lines=['luxury','kebab','arcade'].map(v=>arrivalFor(p,v,false));assert(lines.every(Boolean));assert.equal(new Set(lines).size,3);
  const mistake=arrivalFor(p,p.venuePreference,true);assert.match(mistake,/juste ici/);
  assert(!/points|affinité|respect|−[0-9]/.test(mistake));
 }
});
