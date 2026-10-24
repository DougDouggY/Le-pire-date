import test from 'node:test';
import assert from 'node:assert/strict';
import { participant, completeSocialResult } from './social.mjs';

test('public player metadata is bounded and contains no unrelated input fields',()=>{
 const id=crypto.randomUUID();
 const p=participant({id,name:'  Alex\n\u200b  ',stats:{games:2,wins:900,losses:900},token:'not-public'},0);
 assert.equal(p.name,'Alex');assert.equal(p.id,id);assert.deepEqual(p.stats,{games:2,wins:2,losses:0});assert.equal(p.token,undefined);
});
test('finishing a cooperative match updates the declared totals once',()=>{
 const room={participants:[participant({name:'Alex',stats:{games:3,wins:2,losses:1}},0),participant({name:'Robin'},1)],match:{id:'unique-result',mode:'doubleDate',done:true,successful:true}};
 completeSocialResult(room,[[],[]]);completeSocialResult(room,[[],[]]);
 assert.equal(room.participants[0].stats.games,4);assert.equal(room.participants[0].stats.wins,3);assert.equal(room.participants[1].stats.games,1);assert.deepEqual(room.match.result.outcomes,['win','win']);
});
