import { CONTENT, NARRATIVE_BRANCHES, NARRATIVE_OBSERVATIONS, getPair, getProfile, publicProfile, coachDossier } from './content.mjs';
const modes = ['doubleDate','versus','coach'];
export const PRESENCE_TIMEOUT_MS=90000;
const HEARTBEAT_MIN_INTERVAL_MS=25000;
const pick=(xs)=>xs[Math.floor(Math.random()*xs.length)];
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n&31]).join('');
function facePath(profile){ const pool=CONTENT[profile.mode]?.profiles||[]; const i=pool.findIndex(x=>x.id===profile.id); return `/solo/assets/mp/${profile.mode}-${i+1}.webp`; }
function buildMatch(mode, excluded=null){
 const content=CONTENT[mode];
 if(mode==='doubleDate'){
  const pairs=content.pairs.filter(x=>x.id!==excluded);const pair=pick(pairs.length?pairs:content.pairs); return {mode,kind:pair.id, pair:{title:pair.title,relation:pair.relation,opening:pair.opening,profiles:pair.profiles.map(id=>getProfile(mode,id).id)}, round:0, picks:{}, scores:[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}], group:0, memories:[], done:false};
 }
 const candidates=content.profiles.filter(x=>x.id!==excluded);const p=pick(candidates.length?candidates:content.profiles); return {mode,profileId:p.id,round:0,picks:{},scores:[{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0},{connection:0,trust:0,respect:0,curiosity:0,consistency:0,care:0}],memories:[],done:false};
}
function scenesFor(match){ if(match.mode==='doubleDate') return getPair(match.kind).rounds; const p=getProfile(match.mode,match.profileId);return p.scenes||p.stories||[]; }
function sceneFor(match){const scene=scenesFor(match)[match.round];if(!scene)return null;const key=`${match.mode==='doubleDate'?match.kind:match.profileId}:${scene.id}`;const branch=(NARRATIVE_BRANCHES[key]||[]).find(x=>match.memories.some(m=>m.tag===x.memory));return branch?{...scene,prompt:branch.prompt,options:branch.options}:scene;}
function applyEffect(score,effect,difficulty='normal'){for(const [k,v] of Object.entries(effect||{})){const key=({judgment:'respect',truth:'trust',accountability:'trust',empathy:'care',connection2:'connection'})[k]||k;const scale=difficulty==='difficile'&&v<0?1.5:difficulty==='facile'&&v>0?1.25:1;if(key in score)score[key]+=Math.sign(v)*Math.ceil(Math.abs(v)*scale);}}
function beatsNone(value,difficulty){return value>=({facile:0,normal:2,difficile:4}[difficulty]??2);}
function versusValue(s){return s.connection+s.trust*1.5+s.respect+s.curiosity*.5+s.consistency*.5+s.care*.5;}
function finalizeMatch(room,m,scenes){if(m.round<scenes.length)return;m.done=true;if(m.mode==='doubleDate'){const pass=room.difficulty==='facile'?m.scores.every(s=>s.connection>=1&&s.respect>=-1)&&m.group>=3:room.difficulty==='difficile'?m.scores.every(s=>s.connection>=3&&s.respect>=1)&&m.group>=6:m.scores.every(s=>s.connection>=2&&s.respect>=0)&&m.group>=4;m.ending=pass?'Les deux rendez-vous se prolongent. Vous avez réussi à faire une vraie table, pas deux monologues côte à côte.':'La table se sépare en deux conversations qui ne retrouvent pas le même rythme. L’équipe échoue, même si une connexion a survécu.';}else if(m.mode==='versus'){const ranked=m.scores.map((score,i)=>({i,v:versusValue(score)})).sort((a,b)=>b.v-a.v);m.ending=!beatsNone(ranked[0].v,room.difficulty)?'Elle préfère rentrer seule après une soirée où aucun de vous n’a vraiment écouté.':ranked[0].v===ranked[1].v?'Vous avez tous deux été sincères, mais elle ne ressent pas assez de différence pour choisir l’un de vous.':`Elle choisit le joueur ${ranked[0].i+1} : sa façon d’écouter est restée cohérente quand la conversation a bifurqué.`;m.winner=!beatsNone(ranked[0].v,room.difficulty)||ranked[0].v===ranked[1].v?null:ranked[0].i;}}
export function initRoom(mode){ if(!modes.includes(mode)) throw Error('Mode inconnu'); return {phase:'playing',mode,players:[true,false],ready:[true,false],match:buildMatch(mode),chat:[],lastSeen:[Date.now(),0]}; }
export function startRoom(){return {phase:'lobby',mode:null,difficulty:'normal',players:[true,false],ready:[false,false],match:null,chat:[],lastSeen:[Date.now(),0]};}
function candidateSet(profile, mode){ const all=CONTENT[mode].profiles; const targetIndex=all.findIndex(p=>p.id===profile.id); const seats=all.map((p,i)=>({key:`seat-${crypto.randomUUID().slice(0,8)}`,image:facePath(p),cue:p.face.cue,target:i===targetIndex}));for(let i=seats.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[seats[i],seats[j]]=[seats[j],seats[i]];}return seats; }
export function publicState(room, role){
 const base={phase:room.phase,mode:room.mode,difficulty:room.difficulty||'normal',players:(room.lastSeen||[Date.now(),Date.now()]).map(t=>Date.now()-t<PRESENCE_TIMEOUT_MS),ready:room.ready.map(Boolean),chat:room.chat.slice(-30).map(m=>({role:m.role,text:m.text,at:m.at})),me:role,updated:room.updated};
 if(room.phase==='lobby') return base;
 const m=room.match, mode=m.mode;
 const identification={
  identifying:!!m.seats,
  identified:!!m.identified?.[role],
  seats:(mode==='doubleDate'?m.seats?.[role]:m.seats)?.map(({key,image,cue})=>room.difficulty==='facile'?{key,image,cue}:{key,image})||null,
 };
 if(mode==='doubleDate'){
  const pair=getPair(m.kind), scene=sceneFor(m);
  return {...base,...identification, pair:{title:pair.title,relation:pair.relation,opening:pair.opening}, profiles:m.pair.profiles.map((id,i)=>{const p=getProfile(mode,id);return {...publicProfile(p,room.difficulty==='facile'),photo:facePath(p),mine:i===role}}),round:Math.min(m.round+1,pair.rounds.length),total:pair.rounds.length,scene:scene?{id:scene.id,prompt:scene.prompt,options:scene.options.map(o=>({id:o.id,text:o.text}))}:null,selected:Object.keys(m.picks).includes(String(role)),revealed:null,lastReveal:m.lastReveal||null,ending:m.done?m.ending:null};
 }
 const p=getProfile(mode,m.profileId), scenes=p.scenes||p.stories||[], scene=sceneFor(m);
 const result={...base,...identification,round:Math.min(m.round+1,scenes.length),total:scenes.length,selected:Object.keys(m.picks).includes(String(role)),revealed:null,ending:m.done?m.ending:null,winner:m.done?m.winner:null,lastReveal:m.lastReveal||null};
 if(mode==='versus') return {...result,profile:{...publicProfile(p,room.difficulty==='facile'),photo:facePath(p)},scene:scene?{id:scene.id,prompt:scene.prompt,turn:scene.turn||'simultaneous',options:scene.turn&&scene.turn!=='simultaneous'&&Number(scene.turn.slice(-1))!==role?[]:scene.options.map(o=>({id:o.id,text:o.text}))}:null};
 // Coach: only coach receives target dossier; seat never receives profile ID, correct choice, or private clues.
 if(role===1) return {...result,roleView:'coach',dossier:coachDossier(p),targetImage:facePath(p),scene:scene?{id:scene.id,prompt:scene.prompt}:null};
 return {...result,roleView:'single',scene:scene?{id:scene.id,prompt:scene.prompt,options:scene.options.map(o=>({id:o.id,text:o.text}))}:null,observation:NARRATIVE_OBSERVATIONS[p.id]?.[m.round]||'Elle prend le temps d’observer ta réaction avant de répondre.'};
}
export async function createRoom(db, mode){
 const host=token(), state=startRoom(); if(mode&&modes.includes(mode)){state.mode=mode;state.phase='lobby';}
 const now=Date.now();await db.prepare('DELETE FROM multiplayer_rooms WHERE expires_at<=?').bind(now).run();let roomCode;
 for(let i=0;i<8;i++){roomCode=code();try{await db.prepare('INSERT INTO multiplayer_rooms (code,host_token_hash,state_json,revision,created_at,updated_at,expires_at) VALUES(?,?,?,0,?,?,?)').bind(roomCode,await hash(host),JSON.stringify(state),now,now,now+12*60*60*1000).run();return {code:roomCode,token:host,role:0};}catch(e){if(!String(e).includes('UNIQUE')) throw e;}}
 throw Error('Impossible de créer un salon');
}
export async function joinRoom(db, roomCode){
 const row=await db.prepare('SELECT * FROM multiplayer_rooms WHERE code=? AND expires_at>?').bind(roomCode,Date.now()).first();if(!row)throw Error('Salon introuvable ou expiré');if(row.guest_token_hash)throw Error('Ce salon est déjà complet');
 const guest=token(),room=JSON.parse(row.state_json),now=Date.now();room.players[1]=true;room.lastSeen[1]=now;room.updated=now;
 const r=await db.prepare('UPDATE multiplayer_rooms SET guest_token_hash=?,state_json=?,revision=revision+1,updated_at=? WHERE code=? AND revision=? AND guest_token_hash IS NULL').bind(await hash(guest),JSON.stringify(room),now,row.code,row.revision).run();if(!r.meta?.changes)throw Error('Un autre joueur vient de rejoindre');
 return {code:row.code,token:guest,role:1,state:publicState(room,1)};
}
export async function readRoom(db, roomCode, bearer){
 const row=await db.prepare('SELECT * FROM multiplayer_rooms WHERE code=? AND expires_at>?').bind(roomCode,Date.now()).first(); if(!row) throw Error('Salon introuvable ou expiré');
 let role=-1; if(await hash(bearer)===row.host_token_hash) role=0; else if(row.guest_token_hash&&await hash(bearer)===row.guest_token_hash) role=1; else throw Error('Accès refusé');
 return {row,room:JSON.parse(row.state_json),role};
}
async function save(db,row,room){const now=Date.now();room.updated=now;const r=await db.prepare('UPDATE multiplayer_rooms SET state_json=?,revision=revision+1,updated_at=? WHERE code=? AND revision=?').bind(JSON.stringify(room),now,row.code,row.revision).run();if(!r.meta?.changes) throw Error('État modifié, recharge la partie');}
async function actOnce(db,roomCode,bearer,action){
 const {row,room,role}=await readRoom(db,roomCode,bearer); const now=Date.now();
 if(action.type==='join'){
  if(role!==0) return publicState(room,role);
  if(!room.players[1]){const guest=token(); const r=await db.prepare('UPDATE multiplayer_rooms SET guest_token_hash=?,revision=revision+1,updated_at=? WHERE code=? AND revision=? AND guest_token_hash IS NULL').bind(await hash(guest),now,row.code,row.revision).run();if(!r.meta?.changes) throw Error('Un autre joueur vient de rejoindre'); room.players[1]=true;room.lastSeen[1]=now; await db.prepare('UPDATE multiplayer_rooms SET state_json=? WHERE code=?').bind(JSON.stringify(room),row.code).run();return {code:row.code,token:guest,role:1,state:publicState(room,1)};}
  return {state:publicState(room,role)};
 }
 if(action.type==='heartbeat'){
  if(now-room.lastSeen[role]>=HEARTBEAT_MIN_INTERVAL_MS){room.lastSeen[role]=now;await save(db,row,room);}
  return publicState(room,role);
 }
 // Real actions already write the room: reuse that write to renew presence.
 room.lastSeen[role]=now;
 if(action.type==='difficulty'){if(role!==0||room.phase!=='lobby'||!['facile','normal','difficile'].includes(action.value))throw Error('Difficulté indisponible');room.difficulty=action.value;room.ready=[false,false];await save(db,row,room);return publicState(room,role);}
 if(action.type==='mode'){
  if(role!==0||room.phase!=='lobby'||!modes.includes(action.mode))throw Error('Choix de mode impossible');room.mode=action.mode;room.ready=[false,false];room.match=null;await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='ready'){
  if(room.phase!=='lobby'||!room.mode||!room.players[1]||room.lastSeen.some(t=>Date.now()-t>PRESENCE_TIMEOUT_MS))throw Error('Il manque un joueur connecté ou un mode');room.ready[role]=!!action.value;
  if(room.ready[0]&&room.ready[1]){room.phase='playing';room.match=buildMatch(room.mode,room.previousProfileId||null);room.previousProfileId=null;if(room.mode==='coach')room.match.seats=candidateSet(getProfile('coach',room.match.profileId),'coach');else if(room.mode==='versus')room.match.seats=candidateSet(getProfile('versus',room.match.profileId),'versus');else room.match.seats=room.match.pair.profiles.map(id=>candidateSet(getProfile('doubleDate',id),'doubleDate'));}
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='identify'){
  const m=room.match;if(room.phase!=='playing'||!m?.seats||m.identified?.[role]||(m.mode==='coach'&&role===1))throw Error('Identification indisponible');const list=m.mode==='doubleDate'?m.seats?.[role]:m.seats;const seat=list?.find(x=>x.key===action.key);if(!seat)throw Error('Choisis une personne affichée');m.identified??=[false,false];m.identified[role]=true;if(m.mode==='coach')m.identified[1]=true;m.identification??=[];m.identification[role]=seat.target; if(!seat.target){m.scores[role].respect-=1;}
  if(m.identified.every(Boolean)){
   if(m.mode==='doubleDate'){m.pair.profiles.forEach((_,i)=>{if(!m.identification[i])m.scores[i].respect-=2;});}
   else if(m.mode==='versus'){m.identification.forEach((ok,i)=>{if(!ok)m.scores[i].respect-=2;});}
   else if(!m.identification[0])m.scores[0].respect-=2;
   m.seats=null;
  }
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='chat'){
  const body=String(action.text||'').trim().slice(0,280);if(!body)throw Error('Message vide');room.chat.push({role,text:body,at:now});room.chat=room.chat.slice(-60);await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='answer'){
  const m=room.match;if(room.phase!=='playing'||m.done||!m.identified?.every(Boolean))throw Error('Le rendez-vous n’est pas prêt');const scenes=scenesFor(m),scene=sceneFor(m);if(!scene)throw Error('Plus de scène');
  if((action.round!==undefined&&action.round!==m.round+1)||(action.sceneId!==undefined&&action.sceneId!==scene.id))throw Error('La scène a changé, recharge la partie');
  const option=scene.options.find(o=>o.id===action.option);if(!option)throw Error('Réponse inconnue');
  if(m.mode==='coach'){if(role!==0)throw Error('Le coach conseille, le célibataire répond');const score=m.scores[0];applyEffect(score,option.effect,room.difficulty);m.lastReveal=[{role:0,option:option.id,text:option.text,reply:option.reply}];if(option.memory)m.memories.push({round:m.round,role:0,tag:option.memory});m.round++;if(m.round>=scenes.length){m.done=true;const pass=room.difficulty==='facile'?score.connection>=3&&score.trust>=0:room.difficulty==='difficile'?score.connection>=6&&score.trust>=2:score.connection>=4&&score.trust>=1;m.ending=pass?'Elle propose un deuxième rendez-vous. Votre ami a su écouter, et toi l’aider à lire ce qui n’était pas dit.':'Elle vous remercie pour la soirée. Vous avez repéré certains indices, mais pas encore trouvé la bonne façon d’y répondre.';m.winner=pass?0:null;}await save(db,row,room);return publicState(room,role);}
  if(m.picks[role])throw Error('Réponse déjà envoyée');
  if(m.mode==='versus'&&scene.turn&&scene.turn!=='simultaneous'){const actor=Number(scene.turn.slice(-1));if(role!==actor)throw Error('Cette question s’adresse à l’autre prétendant');m.picks[role]=option.id;applyEffect(m.scores[role],option.effect,room.difficulty);if(option.memory)m.memories.push({round:m.round,role,tag:option.memory});m.lastReveal=[{role,option:option.id,text:option.text,reply:option.reply}];m.round++;m.picks={};finalizeMatch(room,m,scenes);await save(db,row,room);return publicState(room,role);}
  m.picks[role]=option.id;
  if(Object.keys(m.picks).length===2){
   const ids=Object.keys(m.picks);for(const r of ids){const chosen=scene.options.find(o=>o.id===m.picks[r]);const score=m.scores[Number(r)];applyEffect(score,chosen.effect,room.difficulty);}
   if(m.mode==='doubleDate'){const [a,b]=ids.map(r=>scene.options.find(o=>o.id===m.picks[r]));const raw=(a.effect.group||0)+(b.effect.group||0),scale=room.difficulty==='difficile'&&raw<0?1.5:room.difficulty==='facile'&&raw>0?1.25:1;m.group+=Math.sign(raw)*Math.ceil(Math.abs(raw)*scale);}
   for(const r of ids){const chosen=scene.options.find(o=>o.id===m.picks[r]);if(chosen.memory)m.memories.push({round:m.round,role:Number(r),tag:chosen.memory});}
   m.lastReveal=ids.map(r=>({role:Number(r),option:m.picks[r],text:scene.options.find(o=>o.id===m.picks[r]).text,reply:scene.options.find(o=>o.id===m.picks[r]).reply}));m.round++;m.picks={};
   finalizeMatch(room,m,scenes);
  }
  await save(db,row,room);return publicState(room,role);
 }
 if(action.type==='continue'){
  const m=room.match;if(m?.done){room.previousProfileId=m.mode==='doubleDate'?m.kind:m.profileId;room.phase='lobby';room.ready=[false,false];room.match=null;room.chat=[];await save(db,row,room);return publicState(room,role);}return publicState(room,role);
 }
 if(action.type==='swapRoles'){
  if(room.mode!=='coach'||!room.match?.done)throw Error('L’inversion est disponible après une partie Coach');
  room.previousProfileId=room.match.profileId;room.phase='lobby';room.ready=[false,false];room.match=null;room.chat=[];room.updated=now;
  const r=await db.prepare('UPDATE multiplayer_rooms SET host_token_hash=?,guest_token_hash=?,state_json=?,revision=revision+1,updated_at=? WHERE code=? AND revision=?').bind(row.guest_token_hash,row.host_token_hash,JSON.stringify(room),now,row.code,row.revision).run();if(!r.meta?.changes)throw Error('État modifié, recharge la partie');return publicState(room,1-role);
 }
 throw Error('Action inconnue');
}

export async function act(db,roomCode,bearer,action){
 for(let attempt=0;attempt<5;attempt++){try{return await actOnce(db,roomCode,bearer,action);}catch(e){if(!String(e?.message||e).includes('État modifié')||attempt===4)throw e;}}
}
