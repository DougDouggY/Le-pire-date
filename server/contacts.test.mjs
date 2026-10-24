import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function app(storage=new Map()){
 const window={dispatchEvent(){}};
 vm.runInNewContext(readFileSync(new URL('../public/solo/contacts.js',import.meta.url),'utf8'),{
  window,crypto,structuredClone,Event,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
 });
 return {contacts:window.LP_CONTACTS,storage};
}
test('device identity and names survive reload; encounters are retained before any result',()=>{
 const first=app(),player=first.contacts.player('Alex');
 const second=app(first.storage);assert.equal(second.contacts.player().id,player.id);assert.equal(second.contacts.player().name,'Alex');
 second.contacts.remember({me:0,participants:[player,{id:'partner',name:'Robin',stats:{games:3,wins:2,losses:1}}]});
 const contact=second.contacts.data().players.partner;assert.equal(contact.name,'Robin');assert.equal(contact.stats.games,0);assert.equal(contact.publicStats.wins,2);
});
test('a finished result is counted once, retains cooperative history and unlocks only provided dates',()=>{
 const {contacts}=app();const me=contacts.player('Alex');
 const s={me:0,mode:'doubleDate',participants:[me,{id:'partner',name:'Robin',stats:{games:1,wins:1,losses:0}}],result:{id:'match-1',mode:'doubleDate',outcomes:['win','win'],dates:[{id:'dd-livia',name:'Livia',photo:'/solo/assets/mp/doubleDate-1.webp'}]}};
 contacts.result(s);contacts.result(s);
 const data=contacts.data();assert.equal(data.stats.games,1);assert.equal(data.stats.wins,1);assert.equal(data.players.partner.stats.cooperativeWins,1);assert.equal(data.dates['dd-livia'].wins,1);assert.equal(Object.keys(data.dates).length,1);
 s.participants[1].name='Bobby';s.result={id:'match-2',mode:'versus',outcomes:['loss','win'],dates:[]};s.mode='versus';contacts.result(s);
 const next=contacts.data();assert.equal(next.stats.games,2);assert.equal(next.stats.losses,1);assert.equal(next.players.partner.stats.competitiveGames,1);assert.equal(next.players.partner.stats.competitiveWins,0);assert.equal(Object.keys(next.dates).length,1);assert.equal(Object.keys(next.players).length,1);assert.equal(next.players.partner.name,'Bobby');
});
test('solo successes unlock contacts once and previously earned solo achievements are preserved',()=>{
 const {contacts,storage}=app();const profile={id:'zoe',name:'Zoé',photos:['./assets/profile-zoe-1.jpg']};
 contacts.solo(profile,'solo-1');contacts.solo(profile,'solo-1');assert.equal(contacts.data().dates.zoe.wins,1);
 storage.set('foxy.achievements',JSON.stringify(['date-manon']));
 contacts.importSolo([{id:'manon',name:'Manon',photos:['./assets/profile-manon-1.jpg']}],[{id:'date-manon',rule:'profile_win',profile:'manon'}]);
 assert.equal(contacts.data().dates.manon.legacy,true);assert.equal(contacts.data().dates.manon.wins,0);assert.equal(JSON.parse(storage.get('foxy.achievements'))[0],'date-manon');
});
