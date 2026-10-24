import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readActionBody, validateRoomAccess } from './request-guards.mjs';
import { validateConfig } from '../scripts/cloudflare-command.mjs';

const request=(body,headers={})=>new Request('https://date.example/api/multiplayer',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});
test('reject malformed access before querying D1',()=>{
 assert.throws(()=>validateRoomAccess('bad',crypto.randomUUID()+crypto.randomUUID()));
 assert.throws(()=>validateRoomAccess('ABCD1234','invalid'));
 assert.doesNotThrow(()=>validateRoomAccess('ABCD1234',crypto.randomUUID()+crypto.randomUUID()));
});
test('reject foreign origins, malformed JSON and oversized bodies',async()=>{
 await assert.rejects(()=>readActionBody(request('{}',{Origin:'https://foreign.example'})),e=>e.status===403);
 await assert.rejects(()=>readActionBody(request('{}',{'Content-Type':'text/plain'})),e=>e.status===415);
 await assert.rejects(()=>readActionBody(request('{')),e=>e.status===400);
 await assert.rejects(()=>readActionBody(request('[]')),e=>e.status===400);
 await assert.rejects(()=>readActionBody(request(JSON.stringify({text:'x'.repeat(4096)}))),e=>e.status===413);
 assert.deepEqual(await readActionBody(request('{"type":"create"}',{Origin:'https://date.example'})),{type:'create'});
});
test('remote command guards reject placeholder D1 and any different target',()=>{
 const config=JSON.parse(readFileSync(new URL('../wrangler.le-pire-date.json',import.meta.url),'utf8'));
 assert.doesNotThrow(()=>validateConfig(config));
 assert.doesNotThrow(()=>validateConfig(config,{remote:true}));
 const placeholder={...config,d1_databases:[{...config.d1_databases[0],database_id:'00000000-0000-4000-8000-000000000000'}]};
 assert.throws(()=>validateConfig(placeholder,{remote:true}),/NOUVELLE base/);
 assert.throws(()=>validateConfig({...config,name:'other-game'}),/refusée/);
 assert.throws(()=>validateConfig({...config,services:[{binding:'OTHER',service:'other-game'}]}),/autre service/);
});
