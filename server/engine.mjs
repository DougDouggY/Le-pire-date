import { storyScenes, storyAction, storyProjection, invitationFor, introStory, storyTimeout } from './romcom-engine.mjs';
import { revisedImage } from './image-revisions.mjs';
import { conversationScenes } from './conversation.mjs';
import { arrivalFor, moodFor, SPRITES } from './date-presentation.mjs';
import { SHARED_MOMENTS } from './personal-content.mjs';
import { CONTENT, NARRATIVE_BRANCHES, NARRATIVE_OBSERVATIONS, getPair, getProfile, publicProfile, coachDossier } from './content.mjs';
import { VENUES, participant, completeSocialResult, resetForRematch } from './social.mjs';
const modes = ['doubleDate','versus','coach'];
export const PRESENCE_TIMEOUT_MS=90000;
const HEARTBEAT_MIN_INTERVAL_MS=25000;
const pick=(xs)=>xs[Math.floor(Math.random()*xs.length)];
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n&31]).join('');
function facePath(profile){ if(profile.media?.photos?.[0])return profile.media.photos[0];const pool=CONTENT[profile.mode]?.profiles||[]; const i=pool.findIndex(x=>x.id===profile.id); return `/solo/assets/mp/${profile.mode}-${i+1}.webp`; }
function buildMatch(mode, excluded=null){
 const content=CONTENT[mode];
 if(mode==='doubleDate'){
  const pairs=content.pairs.filter(x=>x.id!==excluded);const pair=pick(pairs.length?pairs:content.pairs); return {id:crypto.randomUUID(),presentation:2,conversation:1,story:1,paired:true,personal:true,ownReplies:[null,null],nextReady:[false,false],stage:'foxy',setup:{cities:['',''],liked:[false,false],confirmed:[false,false],pairId:null,profileIds:[null,null],venueVotes:[null,null],venueConfirmed:[false,false]},mode,kind:pair.id, pair:{title:pair.title,relation:pair.relation,opening:pair.opening,profiles:pair.profiles.map(id=>getProfile(mode,id).id)}, round:0, picks:{}, scores:[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}], group:0, memories:[], done:false};
 }
 const candidates=content.profiles.filter(x=>x.id!==excluded);const p=pick(candidates.length?candidates:content.profiles); return {id:crypto.randomUUID(),presentation:2,conversation:1,story:1,chooseVenue:true,stage:'venue',mode,profileId:p.id,round:0,picks:{},scores:[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}],memories:[],done:false};
}
export function scenesFor(match,role=0){
 if(match.story)return storyScenes(match,role);
 let original,p;
 if(match.mode==='doubleDate'&&match.personal){p=getProfile('doubleDate',match.pair.profiles[role]);original=p.duoScenes;}
 else if(match.mode==='doubleDate')return getPair(match.kind).rounds;
 else{p=getProfile(match.mode,match.profileId);original=match.mode==='coach'&&match.presentation===2?p.communicationScenes:p.scenes||p.stories||[];}
 return match.conversation?conversationScenes(p,original,match.venue?.id):original;
}
function sceneFor(match,role=0){let scene=scenesFor(match,role)[match.round];if(!scene)return null;if(match.personal&&match.round===scenesFor(match,role).length-1&&match.memories.some(m=>m.role===role&&m.tag===`${match.pair.profiles[role]}-rushed-0`)){const callbacks={'dd-livia':'Avant de parler de se revoir, Livia revient sur le début : « Quand je parlais des sons de la ville, tu voulais surtout les couper. Tu aurais envie de découvrir ce que j’entends ? »','dd-solene':'Solène revient sur votre arrivée : « Tu voulais prendre le contrôle pour que je me détende. Si on se revoit, on pourrait essayer de choisir à deux ? »','dd-naima':'Naïma reprend ton commentaire sur son détour : « Mon trajet n’était pas une erreur. Tu aurais quand même envie de venir regarder cet atelier avec moi ? »','dd-iris':'Iris regarde l’heure : « Tu voulais que je reste plus longtemps pour toi. Ce café du matin, tu pourrais le prendre comme un vrai rendez-vous ? »'};scene={...scene,prompt:callbacks[match.pair.profiles[role]]||scene.prompt,options:scene.options.map(o=>o.id.endsWith('-listen')?{...o,reply:'« Merci de revenir sur ce qu’on a dit. » '+o.reply}:o)};}const key=`${match.mode==='doubleDate'?(match.personal?match.pair.profiles[role]:match.kind):match.profileId}:${scene.id}`;const branch=(NARRATIVE_BRANCHES[key]||[]).find(x=>match.memories.some(m=>m.tag===x.memory&&(!match.personal||m.role===role)));return branch?{...scene,prompt:branch.prompt,options:branch.options}:scene;}
function applyEffect(score,effect,difficulty='normal'){for(const [k,v] of Object.entries(effect||{})){const key=({judgment:'respect',truth:'trust',accountability:'trust',empathy:'care',connection2:'connection'})[k]||k;const scale=difficulty==='difficile'&&v<0?1.5:difficulty==='facile'&&v>0?1.25:1;if(key in score)score[key]+=Math.sign(v)*Math.ceil(Math.abs(v)*scale);}}
function beatsNone(value,difficulty){return value>=({facile:0,normal:2,difficile:4}[difficulty]??2);}
function versusValue(s){return s.connection+s.trust*1.5+s.respect+s.curiosity*.5+s.consistency*.5+s.care*.5;}
function finalizeMatch(room,m,scenes){if(m.round<scenes.length)return;m.done=true;if(m.mode==='doubleDate'){const pass=room.difficulty==='facile'?m.scores.every(s=>s.connection>=1&&s.respect>=-1)&&m.group>=3:room.difficulty==='difficile'?m.scores.every(s=>s.connection>=3&&s.respect>=1)&&m.group>=6:m.scores.every(s=>s.connection>=2&&s.respect>=0)&&m.group>=4;m.successful=pass;m.ending=pass?'Les deux rendez-vous se prolongent. Vous avez réussi à faire une vraie table, pas deux monologues côte à côte.':'La table se sépare en deux conversations qui ne retrouvent pas le même rythme. L’équipe échoue, même si une connexion a survécu.';}else if(m.mode==='versus'){const ranked=m.scores.map((score,i)=>({i,v:versusValue(score)})).sort((a,b)=>b.v-a.v);m.ending=!beatsNone(ranked[0].v,room.difficulty)?'Elle préfère rentrer seule après une soirée où aucun de vous n’a vraiment écouté.':ranked[0].v===ranked[1].v?'Vous avez tous deux été sincères, mais elle ne ressent pas assez de différence pour choisir l’un de vous.':`Elle choisit le joueur ${ranked[0].i+1} : sa façon d’écouter est restée cohérente quand la conversation a bifurqué.`;m.winner=!beatsNone(ranked[0].v,room.difficulty)||ranked[0].v===ranked[1].v?null:ranked[0].i;}}
function finishCoach(m,difficulty){if(m.round<scenesFor(m).length)return;m.done=true;m.deadline=null;const pass=difficulty==='facile'?m.scores[0].connection>=3&&m.scores[0].trust>=0:difficulty==='difficile'?m.scores[0].connection>=6&&m.scores[0].trust>=2:m.scores[0].connection>=4&&m.scores[0].trust>=1;m.ending=pass?'Elle propose un deuxième rendez-vous. Votre ami a su écouter, et toi l’aider à lire ce qui n’était pas dit.':'Elle vous remercie pour la soirée. Vous avez repéré certains indices, mais pas encore trouvé la bonne façon d’y répondre.';m.winner=pass?0:null;}
function applyCoachTimeout(m,now,difficulty){
 m.scores[0].connection-=2;m.timeoutCount=(m.timeoutCount||0)+1;
 m.lastReveal=[{role:0,text:'Le silence s’installe…',reply:'« Tu es encore avec moi ? J’ai l’impression de parler toute seule… »',tone:'awkward'}];
 m.round++;m.deadline=now+45000;
 finishCoach(m,difficulty);
}
export function initRoom(mode){ if(!modes.includes(mode)) throw Error('Mode inconnu'); return {phase:'playing',mode,players:[true,false],ready:[true,false],match:buildMatch(mode),chat:[],lastSeen:[Date.now(),0]}; }
export function startRoom(){return {phase:'lobby',mode:null,difficulty:'normal',modeSuggestions:[null,null],rematchVotes:[null,null],participants:[null,null],players:[true,false],ready:[false,false],match:null,chat:[],lastSeen:[Date.now(),0]};}
function candidateSet(profile, mode){
 void mode;
 const seats=[{image:profile.media.actor.neutral,cue:profile.face.cue,target:true,kind:'real'},...profile.media.lookalikes.map((image,i)=>({image,cue:i===2?'Une ressemblance… très discutable.':'Observe les détails du visage.',target:false,kind:i===2?'absurd':'credible'}))].map(x=>({...x,key:`seat-${crypto.randomUUID().slice(0,8)}`}));
 for(let i=seats.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[seats[i],seats[j]]=[seats[j],seats[i]];}return seats;
}
function initializeSeats(m){
 if(m.mode==='doubleDate'&&m.personal){m.seats=m.pair.profiles.map(id=>candidateSet(getProfile('doubleDate',id),'doubleDate'));
 }else if(m.mode==='doubleDate'){
  const shared=CONTENT.doubleDate.profiles.slice(0,4).map(p=>({key:`seat-${crypto.randomUUID().slice(0,8)}`,image:facePath(p),cue:p.face.cue,target:false}));
  m.seats=m.pair.profiles.map(id=>shared.map(seat=>({...seat,target:seat.image===facePath(getProfile('doubleDate',id))})));
 }else m.seats=candidateSet(getProfile(m.mode,m.profileId),m.mode);
 m.stage='identification';
}
function successDates(room){
 const m=room.match;
 const contact=p=>({id:p.id,name:p.name,photo:facePath(p)});
 if(m.mode==='doubleDate'&&m.story)return m.pair.profiles.map((id,r)=>m.individual?.[r]==='interested'?[contact(getProfile('doubleDate',id))]:[]);
 if(m.mode==='doubleDate')return m.successful?m.pair.profiles.map(id=>[contact(getProfile('doubleDate',id))]):[[],[]];
 const p=contact(getProfile(m.mode,m.profileId));
 if(m.mode==='coach')return m.winner===0?[[p],[p]]:[[],[]];
 return [0,1].map(role=>m.winner===role?[p]:[]);
}
function setupState(room,role){
 const m=room.match,setup=m.setup;
 if(m.mode!=='doubleDate'||!setup||!['foxy','venue'].includes(m.stage))return null;
 if(m.personal&&m.paired){
  const selected=CONTENT.doubleDate.duos.find(d=>d.id===setup.pairId);
  const duoCard=(duo,id)=>{const members=duo.profiles.map(id=>{const p=getProfile('doubleDate',id);return {...publicProfile(p,true),photo:facePath(p)};});return {...members.find(p=>p.id===id),duo:{id:duo.id,names:duo.names,relation:duo.relation,members}};};
  const expected=selected?.profiles.find(id=>id!==setup.profileIds[1-role]);
  const cards=selected?[duoCard(selected,setup.profileIds[role]||expected)]:CONTENT.doubleDate.duos.map(d=>duoCard(d,d.profiles[role]));
  return {stage:m.stage,matchId:m.id,foxy:{city:setup.cities[role],liked:setup.liked[role],partnerLiked:setup.liked[1-role],confirmed:setup.confirmed?.[role]||false,step:!setup.cities[role]?'location':setup.liked[role]?'waiting':'profiles',profiles:cards,locked:!!selected,revision:setup.revision||0,changeVotes:setup.changeVotes||[false,false],proposal:selected?{names:selected.names,relation:selected.relation,chosenName:getProfile('doubleDate',setup.profileIds[1-role]||setup.profileIds[role]).name,expectedName:getProfile('doubleDate',setup.profileIds[role]||expected).name}:null},venues:VENUES,venueVotes:setup.venueVotes,venueConfirmed:setup.venueConfirmed||[false,false]};
 }
 if(m.personal){const ids=setup.profileIds;const all=CONTENT.doubleDate.profiles;let deck=setup.liked[role]?all.filter(p=>p.id===ids[role]):all.filter(p=>p.id!==ids[1-role]);if(role===1&&!setup.liked[role])deck=deck.slice(2).concat(deck.slice(0,2));return {stage:m.stage,matchId:m.id,foxy:{city:setup.cities[role],liked:setup.liked[role],partnerLiked:setup.liked[1-role],confirmed:setup.confirmed?.[role]||false,step:!setup.cities[role]?'location':setup.liked[role]?'waiting':'profiles',profiles:deck.map(p=>({id:p.id,...publicProfile(p,true),photo:facePath(p)}))},venues:VENUES,venueVotes:setup.venueVotes,venueConfirmed:setup.venueConfirmed||[false,false]};}
 const pairs=CONTENT.doubleDate.pairs.filter(p=>!setup.pairId||p.id===setup.pairId);
 return {stage:m.stage,matchId:m.id,foxy:{city:setup.cities[role],liked:setup.liked[role],partnerLiked:setup.liked[1-role],confirmed:setup.confirmed?.[role]||false,step:!setup.cities[role]?'location':setup.liked[role]?'waiting':'profiles',profiles:pairs.map(pair=>{const p=getProfile('doubleDate',pair.profiles[role]);return {id:p.id,...publicProfile(p,true),photo:facePath(p)};})},venues:VENUES,venueVotes:setup.venueVotes,venueConfirmed:setup.venueConfirmed||[false,false]};
}
export function publicState(room, role){
 const base={phase:room.phase,mode:room.mode,difficulty:room.difficulty||'normal',players:(room.lastSeen||[Date.now(),Date.now()]).map(t=>Date.now()-t<PRESENCE_TIMEOUT_MS),ready:room.ready.map(Boolean),chat:room.chat.slice(-30).map(m=>({role:m.role,text:m.text,at:m.at})),me:role,updated:room.updated,participants:room.participants||[],modeSuggestions:room.modeSuggestions||[null,null],rematchVotes:room.rematchVotes||[null,null]};
 if(room.phase==='lobby') return base;
 const m=room.match, mode=m.mode;
 base.matchId=m.id;
 base.deadline=m.deadline||null;base.serverNow=Date.now();base.timeoutCount=m.timeoutCount||0;
 base.venue=m.venue||VENUES[0];
 base.reaction=m.reaction?{id:m.reaction.id,ready:!!m.reaction.ack[role],both:true}:null;
 if(!m.seats&&m.stage!=='venue'&&!(mode==='coach'&&role===1)){
  const p=getProfile(mode,mode==='doubleDate'?m.pair.profiles[role]:m.profileId),reply=m.personal?m.ownReplies?.[role]:m.reaction?m.lastReveal?.find(r=>r.role===role)||m.lastReveal?.[0]:null;
  const mood=moodFor(m.scores[mode==='coach'?0:role]);const sprites=SPRITES[p.id];
  base.actor={name:p.name,photo:sprites?.[mood]||p.media.actor.neutral,mood,transient:reply?{id:`${m.id}:${m.round}:${reply.option||'timeout'}`,photo:sprites?.[reply.tone==='warm'?'delighted':'displeased']||p.media.actor[reply.tone]||p.media.actor.neutral}:null};
  if(m.round===0&&!reply)base.arrivalNotice=arrivalFor(p,m.story?undefined:m.venue?.id,m.identification?.[role]===false);
 }

 base.result=m.done&&m.result?{...m.result,dates:m.result.dates[role]||[]}:null;
 const story=m.story?storyProjection(room,role):null;if(story)return {...base,...story};
 if(m.story&&mode==='versus'&&m.stage==='venue')return {...base,stage:'venue',venues:VENUES,venueVotes:m.venueVotes||[null,null],venueConfirmed:m.venueConfirmed||[false,false],scene:null};
 const preparation=setupState(room,role);if(preparation)return {...base,...preparation};
 if(mode==='coach'&&m.stage==='venue')return role===1?{...base,stage:'venue',roleView:'coach',dossier:coachDossier(getProfile(mode,m.profileId)),targetImage:facePath(getProfile(mode,m.profileId)),scene:null,lastReveal:[],reaction:null,deadline:null,seats:null}:{...base,stage:'venue',venues:VENUES,scene:null,seats:null};
 const identification={
  identifying:!!m.seats,
  identified:!!m.identified?.[role],
  seats:(mode==='coach'&&role===1?null:mode==='doubleDate'?m.seats?.[role]:m.seats)?.map(({key,image,cue})=>room.difficulty==='facile'?{key,image:revisedImage(image),cue:cue?.replace('frange droite et broche bleue','frange droite et carré châtain')}:{key,image:revisedImage(image)})||null,
 };
 if(mode==='doubleDate'){
  if(m.personal){const scene=sceneFor(m,role),p=getProfile(mode,m.pair.profiles[role]),reply=m.ownReplies?.[role];return {...base,...identification,sharedMoment:m.paired&&CONTENT.doubleDate.duos.find(d=>d.id===m.setup?.pairId)?.moments?.[m.round]|| (m.conversation&&m.round===0?'La table s’installe. Chacun prend le temps de choisir sa boisson.':SHARED_MOMENTS[Math.min(m.round-(m.conversation?1:0),4)]),profiles:[{...publicProfile(p,room.difficulty==='facile'),photo:facePath(p),mine:true}],round:Math.min(m.round+1,scenesFor(m,role).length),total:scenesFor(m,role).length,scene:scene?{id:scene.id,prompt:scene.prompt,transition:scene.transition||null,options:scene.options.map(o=>({id:o.id,text:o.text}))}:null,selected:!!m.picks[role],reaction:reply?{id:scene.id,ready:!!m.nextReady[role],both:!!m.picks[1-role]}:null,lastReveal:reply?[reply]:[],ending:m.done?m.ending:null,personal:true};}
  const pair=getPair(m.kind), scene=sceneFor(m);
  return {...base,...identification, pair:{title:pair.title,relation:pair.relation,opening:pair.opening}, profiles:m.pair.profiles.map((id,i)=>{const p=getProfile(mode,id);return {...publicProfile(p,room.difficulty==='facile'),photo:facePath(p),mine:i===role}}),round:Math.min(m.round+1,pair.rounds.length),total:pair.rounds.length,scene:scene?{id:scene.id,prompt:scene.prompt,transition:scene.transition||null,options:scene.options.map(o=>({id:o.id,text:o.text}))}:null,selected:Object.keys(m.picks).includes(String(role)),revealed:null,lastReveal:m.lastReveal||null,ending:m.done?m.ending:null};
 }
 const p=getProfile(mode,m.profileId), scenes=scenesFor(m), scene=sceneFor(m);
 const result={...base,...identification,round:Math.min(m.reaction?m.round:m.round+1,scenes.length),total:scenes.length,selected:Object.keys(m.picks).includes(String(role)),revealed:null,ending:m.done&&!m.reaction?m.ending:null,winner:m.done?m.winner:null,lastReveal:m.lastReveal||null};
 if(mode==='versus') return {...result,profile:{...publicProfile(p,room.difficulty==='facile'),photo:facePath(p)},scene:scene&&!m.reaction?{id:scene.id,prompt:scene.prompt,transition:scene.transition||null,turn:scene.turn||'simultaneous',options:scene.turn&&scene.turn!=='simultaneous'&&Number(scene.turn.slice(-1))!==role?[]:scene.options.map(o=>({id:o.id,text:o.text}))}:null};
 // Coach: only coach receives target dossier; seat never receives profile ID, correct choice, or private clues.
 if(role===1) return {...result,roleView:'coach',dossier:coachDossier(p),targetImage:facePath(p),scene:null,lastReveal:[],reaction:null,deadline:null};
 return {...result,roleView:'single',scene:scene&&!m.seats&&!m.reaction?{id:scene.id,prompt:scene.prompt,transition:scene.transition||null,options:scene.options.map(o=>({id:o.id,text:o.text}))}:null,observation:NARRATIVE_OBSERVATIONS[p.id]?.[Math.max(0,m.round-(m.conversation?1:0))]||'Elle prend le temps d’observer ta réaction avant de répondre.'};
}
/** @param {object|null} [player] */
export async function createRoom(db, mode, player=null){
 const host=token(), state=startRoom();state.participants[0]=participant(player,0); if(mode&&modes.includes(mode)){state.mode=mode;state.phase='lobby';}
 const now=Date.now();await db.prepare('DELETE FROM multiplayer_rooms WHERE expires_at<=?').bind(now).run();let roomCode;
 for(let i=0;i<8;i++){roomCode=code();try{await db.prepare('INSERT INTO multiplayer_rooms (code,host_token_hash,state_json,revision,created_at,updated_at,expires_at) VALUES(?,?,?,0,?,?,?)').bind(roomCode,await hash(host),JSON.stringify(state),now,now,now+12*60*60*1000).run();return {code:roomCode,token:host,role:0,expiresAt:now+12*60*60*1000};}catch(e){if(!String(e).includes('UNIQUE')) throw e;}}
 throw Error('Impossible de créer un salon');
}
/** @param {object|null} [player] */
export async function joinRoom(db, roomCode, player=null){
 const row=await db.prepare('SELECT * FROM multiplayer_rooms WHERE code=? AND expires_at>?').bind(roomCode,Date.now()).first();if(!row)throw Error('Salon introuvable ou expiré');if(row.guest_token_hash)throw Error('Ce salon est déjà complet');
 const guest=token(),room=JSON.parse(row.state_json),now=Date.now();room.participants??=[participant(null,0),null];room.participants[1]=participant(player,1);room.players[1]=true;room.lastSeen[1]=now;room.updated=now;
 if(room.participants[1].id===room.participants[0].id)throw Error('Ce profil est déjà dans le salon. Utilise un autre appareil ou un autre profil de navigateur pour le deuxième joueur.');
 const r=await db.prepare('UPDATE multiplayer_rooms SET guest_token_hash=?,state_json=?,revision=revision+1,updated_at=? WHERE code=? AND revision=? AND guest_token_hash IS NULL').bind(await hash(guest),JSON.stringify(room),now,row.code,row.revision).run();if(!r.meta?.changes)throw Error('Un autre joueur vient de rejoindre');
 return {code:row.code,token:guest,role:1,expiresAt:row.expires_at,state:publicState(room,1)};
}
export async function readRoom(db, roomCode, bearer, attempt=0){
 const row=await db.prepare('SELECT * FROM multiplayer_rooms WHERE code=? AND expires_at>?').bind(roomCode,Date.now()).first(); if(!row) throw Error('Salon introuvable ou expiré');
 let role=-1; if(await hash(bearer)===row.host_token_hash) role=0; else if(row.guest_token_hash&&await hash(bearer)===row.guest_token_hash) role=1; else throw Error('Accès refusé');
 const room=JSON.parse(row.state_json);
 if(room.match?.mode==='coach'&&!room.match.done&&room.match.deadline&&Date.now()>=room.match.deadline){if(room.match.story)storyTimeout(room);else applyCoachTimeout(room.match,Date.now(),room.difficulty);try{await save(db,row,room);}catch(e){if(attempt<4&&String(e.message).includes('État modifié'))return readRoom(db,roomCode,bearer,attempt+1);throw e;}row.revision++;}
 return {row,room,role};
}
async function save(db,row,room){const m=room.match;if(m?.presentation===2&&!m.personal&&!m.story&&m.lastReveal?.length&&m.presentedRound!==m.round){m.presentedRound=m.round;m.reaction={id:crypto.randomUUID(),ack:[false,m.mode==='coach']};if(m.mode==='coach')m.deadline=null;}if(room.match?.done&&!room.match.reaction)completeSocialResult(room,successDates(room));const now=Date.now();room.updated=now;const r=await db.prepare('UPDATE multiplayer_rooms SET state_json=?,revision=revision+1,updated_at=? WHERE code=? AND revision=?').bind(JSON.stringify(room),now,row.code,row.revision).run();if(!r.meta?.changes) throw Error('État modifié, recharge la partie');}
async function actOnce(db,roomCode,bearer,action){
 const {row,room,role}=await readRoom(db,roomCode,bearer); const now=Date.now();
 if(action.type==='join'){
  if(role!==0) return publicState(room,role);
  if(!room.players[1]){const guest=token(); const r=await db.prepare('UPDATE multiplayer_rooms SET guest_token_hash=?,revision=revision+1,updated_at=? WHERE code=? AND revision=? AND guest_token_hash IS NULL').bind(await hash(guest),now,row.code,row.revision).run();if(!r.meta?.changes) throw Error('Un autre joueur vient de rejoindre'); room.players[1]=true;room.lastSeen[1]=now; await db.prepare('UPDATE multiplayer_rooms SET state_json=? WHERE code=?').bind(JSON.stringify(room),row.code).run();return {code:row.code,token:guest,role:1,expiresAt:row.expires_at,state:publicState(room,1)};}
  return {state:publicState(room,role)};
 }
 if(action.type==='heartbeat'){
  if(now-room.lastSeen[role]>=HEARTBEAT_MIN_INTERVAL_MS){room.lastSeen[role]=now;await save(db,row,room);}
  return publicState(room,role);
 }
 // Real actions already write the room: reuse that write to renew presence.
 room.lastSeen[role]=now;
 if(action.type==='rename'){
  if(room.phase!=='lobby'||room.ready[role])throw Error('Modifie ton nom avant de te préparer');
  const name=participant({name:action.name},role).name;if(!String(action.name||'').trim())throw Error('Indique ton pseudo');
  room.participants[role].name=name;await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='suggestMode'){
  if(role!==1||room.phase!=='lobby'||!modes.includes(action.mode))throw Error('Suggestion indisponible');
  room.modeSuggestions??=[null,null];room.modeSuggestions[role]=action.mode;
  await save(db,row,room);return publicState(room,role);
 }
 if(room.match?.story&&['ackInvitation','answer','nextScene','timeout'].includes(action.type)){
  if(action.type==='timeout'){const m=room.match;if(m.mode==='coach'&&!m.done&&m.deadline&&now>=m.deadline)storyTimeout(room);else return publicState(room,role);}
  else storyAction(room,role,action,now);
  if(room.match.stage==='prepare-identification')initializeSeats(room.match);
  await save(db,row,room);return publicState(room,role);
 }
 if(room.match?.story&&room.mode==='versus'&&['venue','confirmVenue'].includes(action.type)){
  const m=room.match;if(m.stage!=='venue')throw Error('Invitation déjà envoyée');m.venueVotes??=[null,null];m.venueConfirmed??=[false,false];
  if(action.type==='venue'){if(!VENUES.some(v=>v.id===action.venueId))throw Error('Lieu indisponible');m.venueVotes[role]=action.venueId;m.venueConfirmed[role]=false;}
  else{if(!m.venueVotes[role])throw Error('Choisis un lieu');m.venueConfirmed[role]=true;if(m.venueConfirmed.every(Boolean)&&m.venueVotes[0]===m.venueVotes[1])invitationFor(room,m.venueVotes[0]);}
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='chooseVenue'){
  const m=room.match;if(room.phase!=='playing'||m?.mode!=='coach'||m.stage!=='venue'||role!==0)throw Error('Seul le célibataire choisit le lieu');
  const venue=VENUES.find(v=>v.id===action.venueId);if(!venue)throw Error('Lieu indisponible');m.venue=venue;
  if(m.story){invitationFor(room,venue.id);await save(db,row,room);return publicState(room,role);}
  const p=getProfile('coach',m.profileId);applyEffect(m.scores[0],p.venuePreference===venue.id?{connection:1}:{connection:-1},room.difficulty);initializeSeats(m);
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='duoChange'){
  const m=room.match;if(room.phase!=='playing'||!m?.paired||!['foxy','venue'].includes(m.stage)||!m.setup.pairId)throw Error('Changement de duo indisponible');
  const setup=m.setup;if(action.duoRevision!==undefined&&action.duoRevision!==(setup.revision||0))throw Error('La sélection a changé, regarde les duos proposés');setup.changeVotes??=[false,false];setup.changeVotes[role]=action.value!==false;
  if(setup.changeVotes.every(Boolean)){setup.pairId=null;setup.profileIds=[null,null];setup.liked=[false,false];setup.confirmed=[false,false];setup.venueVotes=[null,null];setup.venueConfirmed=[false,false];setup.changeVotes=[false,false];setup.revision=(setup.revision||0)+1;m.stage='foxy';delete m.venue;}
  await save(db,row,room);return publicState(room,role);
 }
 if(['location','likeProfile','confirmMatch','venue','confirmVenue'].includes(action.type)){
  const m=room.match;
  if(room.phase!=='playing'||m?.mode!=='doubleDate'||!m.setup)throw Error('Préparation indisponible');
  const setup=m.setup;if(m.paired&&action.duoRevision!==undefined&&action.duoRevision!==(setup.revision||0))throw Error('La sélection a changé, regarde les duos proposés');
  if(action.type==='location'){
   if(m.stage!=='foxy'||setup.liked[role])throw Error('Localisation déjà validée');
   const city=typeof action.city==='string'?action.city.trim().slice(0,48):'';
   if(!city)throw Error('Indique ta ville');setup.cities[role]=city;
  }else if(action.type==='likeProfile'){
   if(m.stage!=='foxy'||!setup.cities[role]||setup.liked[role])throw Error('Profil indisponible');
   if(m.personal&&m.paired){
    if(action.duoRevision!==undefined&&action.duoRevision!==(setup.revision||0))throw Error('La sélection a changé, regarde les duos proposés');
    const duo=CONTENT.doubleDate.duos.find(d=>d.profiles.includes(action.profileId));if(!duo)throw Error('Duo indisponible');
    if(setup.pairId&&(setup.pairId!==duo.id||setup.profileIds[1-role]===action.profileId))throw Error('Ton partenaire a choisi un duo : sélectionne son autre membre, ou changez ensemble');
    setup.pairId=duo.id;setup.profileIds[role]=action.profileId;setup.liked[role]=true;
    const ordered=[...duo.profiles];if(ordered[role]!==action.profileId)ordered.reverse();m.kind=duo.id;m.pair={title:duo.names,relation:duo.relation,opening:duo.opening,profiles:ordered};
   }
   else if(m.personal){const p=getProfile('doubleDate',action.profileId);if(!p||setup.profileIds[1-role]===p.id)throw Error('Ce profil vient de matcher avec ton ami. Choisis une autre rencontre.');setup.profileIds[role]=p.id;setup.liked[role]=true;m.pair.profiles[role]=p.id;m.pair.relation='Deux conversations, une table à quatre.';m.pair.opening=SHARED_MOMENTS[0];}
   else{const pair=CONTENT.doubleDate.pairs.find(p=>p.profiles[role]===action.profileId&&(!setup.pairId||p.id===setup.pairId));
   if(!pair)throw Error('Ton partenaire a trouvé un autre binôme compatible. Regarde le profil proposé.');
   setup.pairId=pair.id;m.kind=pair.id;m.pair={title:pair.title,relation:pair.relation,opening:pair.opening,profiles:pair.profiles};setup.liked[role]=true;}
   // Both players explicitly confirm their match before moving together.
  }else if(action.type==='confirmMatch'){
   if(m.stage!=='foxy'||!setup.liked[role])throw Error('Trouve ton match avant de confirmer');if(setup.changeVotes?.some(Boolean))throw Error('Répondez à la demande de changement avant de confirmer');
   setup.confirmed??=[false,false];setup.confirmed[role]=true;
   if(setup.confirmed.every(Boolean))m.stage='venue';
  }else if(action.type==='confirmVenue'){
   if(m.stage!=='venue'||!setup.venueVotes[role])throw Error('Choisis un lieu avant de confirmer');if(setup.changeVotes?.some(Boolean))throw Error('Répondez à la demande de changement avant de confirmer');
   setup.venueConfirmed??=[false,false];setup.venueConfirmed[role]=true;
   if(setup.venueConfirmed.every(Boolean)&&setup.venueVotes.every(v=>v===setup.venueVotes[0])){if(m.story)invitationFor(room,setup.venueVotes[0]);else{m.venue=VENUES.find(v=>v.id===setup.venueVotes[0]);initializeSeats(m);}}
  }else{
   if(m.stage!=='venue'||!VENUES.some(v=>v.id===action.venueId))throw Error('Lieu indisponible');
   setup.venueVotes[role]=action.venueId;setup.venueConfirmed??=[false,false];setup.venueConfirmed[role]=false;
  }
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='difficulty'){if(role!==0||room.phase!=='lobby'||!['facile','normal','difficile'].includes(action.value))throw Error('Difficulté indisponible');room.difficulty=action.value;room.ready=[false,false];await save(db,row,room);return publicState(room,role);}
 if(action.type==='mode'){
  if(role!==0||room.phase!=='lobby'||!modes.includes(action.mode))throw Error('Choix de mode impossible');room.mode=action.mode;room.ready=[false,false];room.match=null;await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='ready'){
  if(room.phase!=='lobby'||!room.mode||!room.players[1]||room.lastSeen.some(t=>Date.now()-t>PRESENCE_TIMEOUT_MS))throw Error('Il manque un joueur connecté ou un mode');room.ready[role]=!!action.value;
  if(room.ready[0]&&room.ready[1]){room.phase='playing';room.match=buildMatch(room.mode,room.previousProfileId||null);room.previousProfileId=null;room.rematchVotes=[null,null];if(room.mode!=='doubleDate'&&!room.match.chooseVenue)initializeSeats(room.match);}
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='identify'){
  const m=room.match;if(room.phase!=='playing'||!m?.seats||m.identified?.[role]||(m.mode==='coach'&&role===1))throw Error('Identification indisponible');const list=m.mode==='doubleDate'?m.seats?.[role]:m.seats;const seat=list?.find(x=>x.key===action.key);if(!seat)throw Error('Choisis une personne affichée');m.identified??=[false,false];m.identified[role]=true;if(m.mode==='coach')m.identified[1]=true;m.identification??=[];m.identification[role]=seat.target; if(!seat.target){m.scores[role].respect-=1;}
  if(m.identified.every(Boolean)){
   if(m.mode==='doubleDate'){m.pair.profiles.forEach((_,i)=>{if(!m.identification[i])m.scores[i].respect-=2;});}
   else if(m.mode==='versus'){m.identification.forEach((ok,i)=>{if(!ok)m.scores[i].respect-=2;});}
   else if(!m.identification[0])m.scores[0].respect-=2;
   m.seats=null;m.stage='conversation';if(m.story)introStory(room);if(m.mode==='coach')m.deadline=now+45000;
  }
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='chat'){
  const body=String(action.text||'').trim().slice(0,280);if(!body)throw Error('Message vide');room.chat.push({role,text:body,at:now});room.chat=room.chat.slice(-60);await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='timeout'){
  const m=room.match;if(m?.mode!=='coach'||m.done||!m.deadline||now<m.deadline)return publicState(room,role);
  if(action.round!==m.round+1||action.sceneId!==sceneFor(m)?.id)return publicState(room,role);
  applyCoachTimeout(m,now,room.difficulty);await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='nextScene'){
  const m=room.match;if(!m||room.phase!=='playing')throw Error('Aucune conversation en cours');
  if(m.mode==='doubleDate'&&m.personal){
   if(!m.ownReplies?.[role]||action.sceneId!==sceneFor(m,role)?.id)throw Error('Cette réaction a changé');
   m.nextReady[role]=true;if(m.nextReady.every(Boolean)&&Object.keys(m.picks).length===2){m.round++;m.picks={};m.ownReplies=[null,null];m.nextReady=[false,false];finalizeMatch(room,m,scenesFor(m));}
  }else{if(m.mode==='coach'&&role===1)throw Error('Le Coach reste sur son profil');if(!m.reaction||action.reactionId!==m.reaction.id)throw Error('Cette réaction a changé');m.reaction.ack[role]=true;if(m.reaction.ack.every(Boolean)){m.reaction=null;if(m.mode==='coach'&&!m.done)m.deadline=now+45000;}}
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='answer'){
  const m=room.match;if(room.phase!=='playing'||m.done||m.reaction||!m.identified?.every(Boolean))throw Error('Le rendez-vous n’est pas prêt');const scenes=scenesFor(m,role),scene=sceneFor(m,role);if(!scene)throw Error('Plus de scène');
  if((action.round!==undefined&&action.round!==m.round+1)||(action.sceneId!==undefined&&action.sceneId!==scene.id))throw Error('La scène a changé, recharge la partie');
  if(m.mode==='coach'&&m.deadline&&now>=m.deadline){applyCoachTimeout(m,now,room.difficulty);await save(db,row,room);return publicState(room,role);}
  const option=scene.options.find(o=>o.id===action.option);if(!option)throw Error('Réponse inconnue');
  if(m.mode==='doubleDate'&&m.personal){
   if(m.picks[role])throw Error('Réponse déjà envoyée');m.picks[role]=option.id;applyEffect(m.scores[role],option.effect,room.difficulty);const raw=option.effect.group||0; m.group+=raw;
   if(option.memory)m.memories.push({round:m.round,role,tag:option.memory});m.ownReplies[role]={role,option:option.id,text:option.text,reply:option.reply,tone:(option.effect.connection||0)>0?'warm':'awkward',speaker:getProfile('doubleDate',m.pair.profiles[role]).name};
   await save(db,row,room);return publicState(room,role);
  }
  if(m.mode==='coach'){if(role!==0)throw Error('Le coach conseille, le célibataire répond');const score=m.scores[0];applyEffect(score,option.effect,room.difficulty);m.lastReveal=[{role:0,option:option.id,text:option.text,reply:option.reply,tone:(option.effect.connection||0)>0?'warm':'awkward'}];if(option.memory)m.memories.push({round:m.round,role:0,tag:option.memory});m.round++;m.deadline=now+45000;finishCoach(m,room.difficulty);await save(db,row,room);return publicState(room,role);}
  if(m.picks[role])throw Error('Réponse déjà envoyée');
  if(m.mode==='versus'&&scene.turn&&scene.turn!=='simultaneous'){const actor=Number(scene.turn.slice(-1));if(role!==actor)throw Error('Cette question s’adresse à l’autre prétendant');m.picks[role]=option.id;applyEffect(m.scores[role],option.effect,room.difficulty);if(option.memory)m.memories.push({round:m.round,role,tag:option.memory});m.lastReveal=[{role,option:option.id,text:option.text,reply:option.reply,tone:(option.effect.connection||0)>0?'warm':'awkward'}];m.round++;m.picks={};finalizeMatch(room,m,scenes);await save(db,row,room);return publicState(room,role);}
  m.picks[role]=option.id;
  if(Object.keys(m.picks).length===2){
   const ids=Object.keys(m.picks);for(const r of ids){const chosen=scene.options.find(o=>o.id===m.picks[r]);const score=m.scores[Number(r)];applyEffect(score,chosen.effect,room.difficulty);}
   if(m.mode==='doubleDate'){const [a,b]=ids.map(r=>scene.options.find(o=>o.id===m.picks[r]));const raw=(a.effect.group||0)+(b.effect.group||0),scale=room.difficulty==='difficile'&&raw<0?1.5:room.difficulty==='facile'&&raw>0?1.25:1;m.group+=Math.sign(raw)*Math.ceil(Math.abs(raw)*scale);}
   for(const r of ids){const chosen=scene.options.find(o=>o.id===m.picks[r]);if(chosen.memory)m.memories.push({round:m.round,role:Number(r),tag:chosen.memory});}
   m.lastReveal=ids.map(r=>({role:Number(r),option:m.picks[r],text:scene.options.find(o=>o.id===m.picks[r]).text,reply:scene.options.find(o=>o.id===m.picks[r]).reply,tone:(scene.options.find(o=>o.id===m.picks[r]).effect.connection||0)>0?'warm':'awkward'}));m.round++;m.picks={};
   finalizeMatch(room,m,scenes);
  }
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='continue'||action.type==='swapRoles'){
  if(!room.match?.done)throw Error('Le vote est disponible à la fin de la partie');
  if(action.type==='swapRoles'&&room.mode!=='coach')throw Error('Inversion réservée au Coach');
  room.rematchVotes??=[null,null];
  room.rematchVotes[role]=action.value===false?null:action.type==='swapRoles'?'swap':'lobby';
  const swap=room.rematchVotes.every(v=>v==='swap');
  const again=room.rematchVotes.every(v=>v==='lobby');
  if(!swap&&!again){await save(db,row,room);return publicState(room,role);}
  if(again){resetForRematch(room);await save(db,row,room);return publicState(room,role);}
  resetForRematch(room);
  room.participants?.reverse();room.lastSeen.reverse();
  const r=await db.prepare('UPDATE multiplayer_rooms SET host_token_hash=?,guest_token_hash=?,state_json=?,revision=revision+1,updated_at=? WHERE code=? AND revision=?').bind(row.guest_token_hash,row.host_token_hash,JSON.stringify(room),now,row.code,row.revision).run();
  if(!r.meta?.changes)throw Error('État modifié, recharge la partie');return publicState(room,1-role);
 }
 throw Error('Action inconnue');
}

export async function act(db,roomCode,bearer,action){
 for(let attempt=0;attempt<5;attempt++){try{return await actOnce(db,roomCode,bearer,action);}catch(e){if(!String(e?.message||e).includes('État modifié')||attempt===4)throw e;}}
}
