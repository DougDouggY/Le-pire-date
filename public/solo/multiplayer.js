(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(method,data)=>{const r=await fetch('/api/multiplayer',{method,headers:{'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(data)})});const j=await r.json();if(!r.ok)throw Error(j.error||'Erreur réseau');return j;};
let room=null,poll=null,state=null,lastHeartbeat=0;
let selectedApp='doubleDate',homeView=true;
const animatedRooms=new Set();
const appName=mode=>({doubleDate:'Foxy Duo',versus:'Speedy Foxy Dating',coach:'Blind Foxy'})[mode]||'Foxy Duo';
let generation=0, refreshing=false, sending=false;
let lastChange=Date.now(), failures=0;
function savedRoom(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
const root=document.createElement('div');root.id='mp-overlay';root.innerHTML=`<div class="mp-shell"><header class="mp-head"><span class="mp-kicker">FOXY DUO · RENDEZ-VOUS EN LIGNE</span><button class="mp-close" aria-label="Fermer">×</button></header><main id="mp-content"></main></div>`;document.body.append(root);
const style=document.createElement('style');style.textContent=`#mp-overlay{position:fixed;z-index:99999;inset:0;background:rgba(14,10,13,.92);backdrop-filter:blur(18px);display:none;overflow:auto;color:#f9f0ed;font-family:inherit}#mp-overlay.on{display:block}.mp-shell{width:min(900px,100%);min-height:100dvh;margin:auto;padding:clamp(16px,4vw,38px);box-sizing:border-box}.mp-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff25;padding-bottom:14px}.mp-kicker{letter-spacing:.16em;font-size:11px;color:#efb6ae}.mp-close{border:0;background:#ffffff18;color:white;border-radius:50%;width:38px;height:38px;font-size:25px;cursor:pointer}.mp-page{padding:22px 0}.mp-page h1{font-size:clamp(28px,5vw,48px);line-height:1.05;margin:8px 0 12px}.mp-page h2{margin:6px 0 10px}.mp-muted{color:#c9b9bb;line-height:1.5}.mp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:20px 0}.mp-card{background:#251b22;border:1px solid #ffffff1c;border-radius:18px;padding:17px}.mp-btn{border:0;border-radius:12px;padding:13px 16px;margin:5px 6px 5px 0;background:#f2b9ae;color:#26151b;font-weight:750;cursor:pointer}.mp-btn.secondary{background:#ffffff18;color:#fff;border:1px solid #ffffff24}.mp-btn:disabled{opacity:.45}.mp-input{background:#151115;color:white;border:1px solid #ffffff38;border-radius:11px;padding:12px;font:inherit;max-width:170px;text-transform:uppercase}.mp-code{font-size:30px;font-weight:850;letter-spacing:.22em;color:#ffd5c6}.mp-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin:18px 0}.mp-mode{background:#281d25;border:1px solid #ffffff25;border-radius:15px;padding:16px;text-align:left;color:white;cursor:pointer}.mp-mode.selected{outline:2px solid #f2b9ae}.mp-people,.mp-candidates{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.mp-person{flex:1;min-width:160px;background:#241a20;border-radius:15px;padding:13px}.mp-photo{width:100%;max-height:270px;object-fit:cover;border-radius:14px}.mp-candidate{width:min(30%,180px);min-width:95px;background:#241a20;color:white;border:1px solid #ffffff30;border-radius:14px;padding:7px;cursor:pointer}.mp-candidate img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block}.mp-candidate span{display:block;padding:7px 3px 3px;font-size:11px;color:#d0c1c3}.mp-scene{background:#261d24;border-radius:20px;padding:20px;margin:18px 0}.mp-question{font-size:21px;line-height:1.45}.mp-choice{display:block;width:100%;text-align:left;background:#382a34;color:white;border:1px solid #ffffff22;border-radius:13px;padding:14px;margin:9px 0;cursor:pointer;font:inherit}.mp-choice:hover{border-color:#f2b9ae}.mp-result{background:#18302a;border-radius:13px;padding:13px;margin:8px 0}.mp-chat{display:grid;grid-template-columns:1fr auto;gap:8px;margin:15px 0}.mp-chat input{width:100%;box-sizing:border-box;background:#171217;border:1px solid #ffffff30;border-radius:10px;color:white;padding:11px;font:inherit}.mp-messages{max-height:140px;overflow:auto;color:#e5d5d8;font-size:13px}.mp-error{color:#ffd1c7;background:#512d37;border-radius:10px;padding:10px;margin:12px 0}.mp-pills{display:flex;gap:8px;flex-wrap:wrap}.mp-pill{padding:7px 10px;border-radius:999px;background:#ffffff17;color:#e9d8da;font-size:12px}.mp-dossier details{background:#251b22;border-radius:12px;padding:12px;margin:8px 0}.mp-dossier summary{cursor:pointer;font-weight:bold}.mp-wait{padding:12px;color:#ffe0d4}.mp-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:14px}@media(max-width:560px){.mp-page{padding-top:14px}.mp-grid{grid-template-columns:1fr}.mp-photo{max-height:220px}.mp-question{font-size:18px}}`;
document.head.append(style);
const content=()=>root.querySelector('#mp-content');const open=(mode='doubleDate')=>{selectedApp=mode;root.querySelector('.mp-head .mp-kicker').textContent=appName(mode);root.classList.add('on');generation++;clearTimeout(poll);home();};const close=()=>{root.querySelector('dialog')?.close();root.classList.remove('on');clearTimeout(poll);poll=null;generation++;};root.querySelector('.mp-close').onclick=close;
function fail(e){const old=content().querySelector('.mp-error');if(old)old.remove();content().insertAdjacentHTML('afterbegin',`<div class="mp-error">${esc(e.message||e)}</div>`);}
function home(){
 homeView=true;state=null;
 const saved=savedRoom('lpdate-mp')||savedRoom('lpdate-mp-recovery');
 content().innerHTML=`<section class="mp-page"><p class="mp-kicker">${esc(appName(selectedApp))}</p><h1>Invite ton ami.</h1><p class="mp-muted">Le même malaise, mais avec quelqu’un à qui en reparler après.</p>${saved?`<article class="mp-card"><h2>Salon précédent · ${esc(saved.code)}</h2><button class="mp-btn secondary" id="mp-resume">Reprendre le salon</button></article>`:''}<div class="mp-grid"><article class="mp-card"><h2>Créer un salon</h2><p class="mp-muted">Invite ton partenaire avec un code privé.</p><button class="mp-btn" id="mp-create">Créer un salon</button></article><article class="mp-card"><h2>Rejoindre</h2><p class="mp-muted">Saisis le code reçu.</p><input id="mp-join-code" class="mp-input" maxlength="8" placeholder="ABCD1234"><button class="mp-btn" id="mp-join">Rejoindre</button></article></div></section>`;
 const player=()=>window.LP_CONTACTS.player();
 content().querySelector('#mp-resume')?.addEventListener('click',()=>{homeView=false;room=saved;localStorage.setItem('lpdate-mp',JSON.stringify(room));showLobby();});
 content().querySelector('#mp-create').onclick=async()=>{try{const r=await api('POST',{type:'create',mode:selectedApp,player:player()});enter(r);showLobby();}catch(e){fail(e);}};
 content().querySelector('#mp-join').onclick=async()=>{try{const code=content().querySelector('#mp-join-code').value.trim().toUpperCase();const r=await api('POST',{type:'join',code,player:player()});enter(r);render(r.state);startPoll();}catch(e){fail(e);}};
}
function leaveRoom(){if(room)localStorage.setItem('lpdate-mp-recovery',JSON.stringify(room));localStorage.removeItem('lpdate-mp');room=null;state=null;generation++;clearTimeout(poll);poll=null;home();}
function playerName(s,role){return s.participants?.[role]?.name||`Joueur ${role+1}`;}
function statsHtml(stats){return `<div class="contact-stats">${[['games','Parties'],['wins','Victoires'],['losses','Défaites']].map(([key,label])=>`<div class="contact-stat"><strong>${Number(stats?.[key])||0}</strong><span>${label}</span></div>`).join('')}</div>`;}
function peopleHtml(s){return `<div class="mp-people">${[0,1].map(role=>`<div class="mp-person"><button class="mp-player-button" data-player-role="${role}"><b>${esc(playerName(s,role))}${role===s.me?' · toi':''}</b><small>${s.players[role]?'Connecté':'En attente'}${s.mode==='coach'?role===0?' · en rendez-vous':' · coach':''}${s.phase==='lobby'&&s.ready[role]?' · prêt':''}</small></button></div>`).join('')}</div>`;}
function bindPeople(s){content().querySelectorAll('[data-player-role]').forEach(b=>b.onclick=()=>{
 const role=Number(b.dataset.playerRole),p=s.participants?.[role];if(!p)return;
 root.querySelector('dialog')?.remove();const dialog=document.createElement('dialog');dialog.className='mp-profile-dialog';
 const contact=window.LP_CONTACTS.data().players[p.id];
 dialog.innerHTML=`<button class="mp-btn secondary" id="mp-profile-close">Fermer</button><h2>${esc(p.name)}</h2><p class="mp-muted">Profil Foxy Duo · historique de son appareil</p>${statsHtml(p.stats)}${role!==s.me?`<h3>Avec toi</h3>${statsHtml(contact?.stats)}<p class="mp-muted">${contact?.stats.cooperativeWins||0} victoires ensemble · ${contact?.stats.competitiveWins||0} victoires pour toi face à face.</p>`:''}`;
 root.append(dialog);dialog.querySelector('#mp-profile-close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.showModal();
 });}
function enter(r){homeView=false;generation++;lastHeartbeat=Date.now();lastChange=Date.now();failures=0;state=null;room={code:r.code,token:r.token,role:r.role};localStorage.setItem('lpdate-mp',JSON.stringify(room));}
function auth(){if(!room)throw Error('Rejoins ou crée un salon.');return {code:room.code,token:room.token};}
async function send(action){
 if(sending)return;
 const session=room, ticket=++generation;
 sending=true;
 content().querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  const s=await api('POST',{...auth(),action});
  if(room===session&&generation===ticket){lastHeartbeat=Date.now();lastChange=Date.now();failures=0;render(s);}
  return s;
 }catch(e){
  if(room===session&&generation===ticket){
   // A rejected stale action should also recover the latest server state.
   try{const s=await getState();if(room===session&&generation===ticket)render(s);}catch{if(state)render(state);}
  }
  throw e;
 }finally{sending=false;schedulePoll();}
}
async function getState(){const a=auth();if(Date.now()-lastHeartbeat>=30000){const s=await api('POST',{...a,action:{type:'heartbeat'}});lastHeartbeat=Date.now();return s;}const r=await fetch(`/api/multiplayer?code=${encodeURIComponent(a.code)}`,{cache:'no-store',headers:{Authorization:`Bearer ${a.token}`}});const j=await r.json();if(!r.ok)throw Error(j.error);return j;}
async function refresh(){
 if(refreshing||sending||!room||homeView)return;
 refreshing=true;
 const session=room,ticket=generation;
 try{const s=await getState();if(room===session&&generation===ticket){failures=0;if(stateSignature(s)!==stateSignature(state)){lastChange=Date.now();render(s);}else{state=s;clientReceivedAt=Date.now();}}}
 catch(e){if(room===session&&generation===ticket){failures++;fail(e);}}
 finally{refreshing=false;}
}
// Heartbeats and clock samples are not gameplay activity: keep idle backoff.
function stateSignature(s){if(!s)return '';const {updated,serverNow,...visible}=s;void updated;void serverNow;return JSON.stringify(visible);}
function pollDelay(){
 if(failures)return Math.min(60000,5000*2**Math.min(failures,4));
 const quiet=Date.now()-lastChange;
 if(quiet>=120000)return 20000;
 if(state?.ending)return state.rematchVotes?.some(Boolean)?quiet>=30000?10000:5000:20000;
 if(quiet>=30000||(state?.phase==='lobby'&&!state.players[1]))return 10000;
 return 5000;
}
function schedulePoll(){
 clearTimeout(poll);poll=null;
 if(homeView||!room||document.hidden||!root.classList.contains('on'))return;
 poll=setTimeout(async()=>{await refresh();schedulePoll();},pollDelay());
}
function startPoll(){schedulePoll();}
function showLobby(){refresh().finally(schedulePoll);}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){clearTimeout(poll);poll=null;}
 else if(!homeView&&room&&root.classList.contains('on')){lastHeartbeat=0;showLobby();}
});
function modeName(m){return ({doubleDate:'Double Date',versus:'Date à 3',coach:'Le Coach'})[m]||m;}
function renderLobby(s){
 const together=!!s.participants?.[1],animate=together&&!animatedRooms.has(room.code);if(together)animatedRooms.add(room.code);
 content().innerHTML=`<section class="mp-page" data-step="${together?'preparation':'invitation'}"><p class="mp-kicker">${esc(appName(s.mode))} · ${together?'PRÉPARATION':'INVITATION'}</p><h1>${together?'Vous vous êtes trouvés !':`Invite ton ami avec ce code`}</h1>${!together?`<p class="mp-code">${esc(room.code)}</p><button class="mp-btn secondary" id="mp-copy">Copier le code</button>`:''}${together?`<div class="mp-forest ${animate?'mp-meeting':''}" aria-label="Deux renards se retrouvent dans la forêt">${[0,1].map(role=>`<div class="mp-forest-player fox-${role}"><button class="mp-player-button" data-player-role="${role}" aria-label="Profil de ${esc(playerName(s,role))}"><img src="/solo/assets/foxy-mascot.webp" alt="Renard ${role+1}"><strong>Joueur ${role+1}${role===s.me?' · toi':''}</strong><span>${esc(playerName(s,role))}${s.ready[role]?' · prêt':''}</span></button></div>`).join('')}</div><label for="mp-player-name">Ton pseudo</label><input id="mp-player-name" data-preserve class="mp-input" maxlength="28" value="${esc(playerName(s,s.me))}" ${s.ready[s.me]?'disabled':''}><h2>${esc(modeName(s.mode))}</h2>${s.me===0?`<label>Difficulté <select id="mp-difficulty">${['facile','normal','difficile'].map(d=>`<option ${s.difficulty===d?'selected':''}>${d}</option>`).join('')}</select></label>`:`<p>Difficulté : ${esc(s.difficulty)}</p>`}<button class="mp-btn" id="mp-ready">${s.ready[s.me]?'Annuler ma disponibilité':'Je suis prêt'}</button>`:`<p class="mp-muted">Envoie ce code à ton ami. Il ouvre une application Foxy multijoueur et choisit Rejoindre. Vous choisirez vos pseudos une fois réunis.</p>`}<button class="mp-btn secondary" id="mp-switch-room">Changer de salon</button></section>`;
 content().querySelector('#mp-difficulty')?.addEventListener('change',async e=>{try{await send({type:'difficulty',value:e.target.value});}catch(err){fail(err);}});
 content().querySelector('#mp-ready')?.addEventListener('click',async()=>{try{if(!s.ready[s.me]){const name=content().querySelector('#mp-player-name').value.trim();if(!name)throw Error('Indique ton pseudo');await send({type:'rename',name});window.LP_CONTACTS.player(name);}await send({type:'ready',value:!s.ready[s.me]});}catch(e){fail(e);}});
 content().querySelector('#mp-copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(room.code);content().querySelector('#mp-copy').textContent='Code copié !';}catch{fail('Copie le code affiché ci-dessus pour inviter ton ami.');}});
 content().querySelector('#mp-switch-room').onclick=leaveRoom;
}
let browseIndex=0,browseMatch=null;
function renderSetup(s){
 if(browseMatch!==s.matchId){browseIndex=0;browseMatch=s.matchId;}
 if(s.stage==='venue'){
  content().innerHTML=`<section class="mp-page"><p class="mp-kicker">DEUX MATCHS · UNE SOIRÉE</p><h1>Où on se retrouve ?</h1>${peopleHtml(s)}<p class="mp-muted">Choisissez tous les deux la même adresse pour y aller ensemble.</p><div class="mp-venue-grid">${s.venues.map(v=>`<button class="mp-venue-card ${s.venueVotes[s.me]===v.id?'selected':''}" data-venue="${v.id}"><img src="${v.image}" alt=""><div><b>${esc(v.name)}</b><small>${esc(v.tag)}</small>${[0,1].filter(role=>s.venueVotes[role]===v.id).map(role=>`<small>♥ ${esc(playerName(s,role))}</small>`).join('')}</div></button>`).join('')}</div><button class="mp-btn" id="mp-confirm-venue" ${!s.venueVotes[s.me]||s.venueConfirmed[s.me]?'disabled':''}>${s.venueConfirmed[s.me]?'Lieu confirmé · en attente de ton ami':'Valider ce lieu'}</button>${chatHtml(s)}</section>`;
  content().querySelector('#mp-confirm-venue').onclick=async()=>{try{await send({type:'confirmVenue'});}catch(e){fail(e);}};
  content().querySelectorAll('[data-venue]').forEach(b=>b.onclick=async()=>{try{await send({type:'venue',venueId:b.dataset.venue});}catch(e){fail(e);}});bindChat();return;
 }
 const f=s.foxy,p=f.profiles[browseIndex%f.profiles.length];
 const header=`<div class="mp-foxy-top"><img src="/solo/assets/foxy-mascot.webp" alt=""><div><b>Foxy</b><small>DOUBLE DATE · ${esc(playerName(s,s.me))}</small></div></div>`;
 let body;
 if(f.step==='location')body=`<p class="mp-kicker">PREMIÈRE OUVERTURE</p><h1>Où tu cherches ?</h1><p class="mp-muted">Entre ta ville pour préparer ton profil. Ton partenaire renseigne la sienne sur son téléphone.</p><label for="mp-city">Ta ville ou ton village</label><input class="mp-input" data-preserve id="mp-city" maxlength="48" placeholder="Ex. Roquemaure" value="${esc(f.city)}"><button class="mp-btn" id="mp-city-next">Continuer sur Foxy</button>`;
 else if(f.step==='waiting')body=`<div class="mp-match-heart">♥</div><h1>Match !</h1><p class="mp-muted">${esc(p.name)} a aimé ton profil. ${f.partnerLiked?'Ton partenaire a aussi trouvé son match.':`On attend que ${esc(playerName(s,1-s.me))} trouve aussi son match.`}</p><img class="mp-photo" src="${p.photo}" alt="${esc(p.name)}"><p class="mp-location-label">⌖ ${esc(f.city)}</p><p>${esc(p.bio)}</p><button class="mp-btn" id="mp-confirm-match" ${f.confirmed?'disabled':''}>${f.confirmed?'Prêt · en attente de ton ami':'Je suis prêt pour le rendez-vous'}</button>`;
 else body=`<p class="mp-location-label">⌖ ${esc(f.city)} · autour de toi</p><div class="mp-foxy-card" data-profile-id="${p.id}"><img src="${p.photo}" alt="${esc(p.name)}"><div class="mp-foxy-caption"><h2>${esc(p.name)}, ${p.age}</h2><p>${esc(p.job)}</p><p>${esc(p.bio)}</p><div class="mp-pills">${p.interests.map(x=>`<span class="mp-pill">${esc(x)}</span>`).join('')}</div></div></div><div class="mp-swipe-actions"><button class="mp-btn secondary" id="mp-pass-profile" aria-label="Profil suivant">×</button><button class="mp-btn" id="mp-like-profile" data-profile="${p.id}" aria-label="J'aime ce profil">♥</button></div><p class="mp-muted">Chacun son profil. Vos deux matchs forment un binôme compatible pour la soirée.</p>`;
 content().innerHTML=`<section class="mp-page">${peopleHtml(s)}<div class="mp-foxy-phone">${header}<div class="mp-foxy-body" data-foxy-step="${f.step}">${body}</div></div>${chatHtml(s)}</section>`;
 content().querySelector('#mp-confirm-match')?.addEventListener('click',async()=>{try{await send({type:'confirmMatch'});}catch(e){fail(e);}});
 content().querySelector('#mp-city-next')?.addEventListener('click',async()=>{try{await send({type:'location',city:content().querySelector('#mp-city').value});}catch(e){fail(e);}});
 content().querySelector('#mp-city')?.addEventListener('keydown',e=>{if(e.key==='Enter')content().querySelector('#mp-city-next').click();});
 content().querySelector('#mp-pass-profile')?.addEventListener('click',()=>{browseIndex++;render(s);});
 content().querySelector('#mp-like-profile')?.addEventListener('click',async()=>{try{await send({type:'likeProfile',profileId:p.id});}catch(e){fail(e);}});bindChat();
}
function candidateHtml(s,clickable=true){return (s.seats||[]).map((x,i)=>`${clickable?`<button class="mp-candidate" data-seat="${esc(x.key)}">`:`<article class="mp-candidate">`}<img src="${esc(x.image)}" alt="Personne ${i+1}"><span>TABLE ${String(i+1).padStart(2,'0')}</span>${x.cue?`<small>${esc(x.cue)}</small>`:''}${clickable?'</button>':'</article>'}`).join('');}
function chatHtml(s){return `<div class="mp-card"><b>Parler à ton partenaire</b><div class="mp-messages">${(s.chat||[]).map(x=>`<p><b>${x.role===room.role?'Toi':esc(playerName(s,x.role))} :</b> ${esc(x.text)}</p>`).join('')}</div><form class="mp-chat" id="mp-chat-form"><input id="mp-chat-text" maxlength="280" placeholder="Écris un indice ou une observation…"><button class="mp-btn">Envoyer</button></form></div>`;}
function bindChat(){const form=content().querySelector('#mp-chat-form');if(form)form.onsubmit=async e=>{e.preventDefault();const i=content().querySelector('#mp-chat-text');if(!i.value.trim()||sending)return;try{await send({type:'chat',text:i.value});const next=content().querySelector('#mp-chat-text');if(next)next.value='';}catch(err){fail(err);}};}
function renderIdentification(s){
 let lead='Repère la personne du profil avant de commencer le rendez-vous.',target='';
 if(s.mode==='coach'){
  if(s.me===1){lead='Décris les détails à ton ami. Tu ne peux pas cliquer à sa place.';target=`<div class="mp-card"><b>Ta photo de référence</b><img class="mp-photo" src="${esc(s.targetImage)}" alt="Photo du profil à décrire"><p class="mp-muted">Décris les détails visibles sans nommer le profil.</p></div>`;}
  else lead='Tu ne connais pas le profil. Ton coach a la photo : décrivez ensemble ce que vous voyez.';
 }else{const p=s.mode==='doubleDate'?s.profiles.find(x=>x.mine):s.profile;target=`<div class="mp-card mp-target-reference"><img class="mp-photo" src="${p.photo}" alt="Profil de ${esc(p.name)}"><div><h2>${esc(p.name)}</h2><p class="mp-muted">Ton rendez-vous · ${esc(p.job)}</p><details><summary>Revoir son profil</summary><p>${esc(p.bio)}</p></details>${p.faceHint?`<p class="mp-muted">${esc(p.faceHint)}</p>`:''}</div></div>`;}
 const head=`${peopleHtml(s)}<p class="mp-kicker">${s.venue?esc(s.venue.name):'ÉTAPE 1 · RECONNAISSANCE'}</p>`;
 if(s.identified)return `<section class="mp-page">${head}<h1>Tu as choisi.</h1><p class="mp-muted">En attente de ${esc(playerName(s,1-s.me))}…</p>${target}${chatHtml(s)}</section>`;
 return `<section class="mp-page">${head}<h1>${s.mode==='coach'&&s.me===1?'Guide ton partenaire':'Qui est ton rendez-vous ?'}</h1><p class="mp-muted">${lead}</p>${target}<div class="mp-tableau"><p class="mp-table-caption">${s.mode==='doubleDate'?'Vous êtes arrivés ensemble. Chacun cherche sa partenaire.':'Les personnes installées dans la salle'}</p><div class="mp-candidates">${candidateHtml(s,!(s.mode==='coach'&&s.me===1))}</div></div>${chatHtml(s)}</section>`;
}
function renderPlay(s){
if(s.ending){
 const votes=s.rematchVotes||[null,null],own=votes[s.me];
 content().innerHTML=`<section class="mp-page">${peopleHtml(s)}<p class="mp-kicker">FIN DU RENDEZ-VOUS · ${esc(modeName(s.mode))}</p><h1>${esc(s.ending.replace(/joueur ([12])/g,(_,number)=>playerName(s,Number(number)-1)))}</h1>${revealHtml(s)}${s.result?.dates?.length?`<p class="mp-muted">♥ ${s.result.dates.map(p=>esc(p.name)).join(', ')} rejoint tes contacts.</p>`:''}<div class="mp-votes"><b>On remet ça ?</b>${[0,1].map(role=>`<div class="mp-vote-line"><span>${esc(playerName(s,role))}</span><span>${votes[role]==='swap'?'Inverser les rôles':votes[role]==='lobby'?'Retour au salon':'Pas encore voté'}</span></div>`).join('')}<p class="mp-muted">Vous devez choisir tous les deux la même option pour rejouer.</p></div><button class="mp-btn" id="mp-rematch">${own==='lobby'?'Annuler mon vote':'Voter pour rejouer'}</button>${s.mode==='coach'?`<button class="mp-btn secondary" id="mp-swap">${own==='swap'?'Annuler mon vote':'Voter pour inverser les rôles'}</button>`:''}<button class="mp-btn secondary" id="mp-contacts">Voir mes contacts</button><button class="mp-btn secondary" id="mp-leave-room">Quitter ce salon</button>${chatHtml(s)}</section>`;bindPlay(s);return;
}
const isCoach= s.mode==='coach'&&room.role===1;const question=s.scene?.prompt||'Le rendez-vous reprend…';let scene=`<div class="mp-scene" data-round="${s.round}"><p class="mp-kicker">${esc(modeName(s.mode))} · ${s.round}/${s.total}</p><p class="mp-question">${esc(question)}</p>`;
if(s.mode==='doubleDate'&&s.pair&&s.round===1){scene+=`<p class="mp-muted">${esc(s.pair.relation)}</p><p class="mp-muted">${esc(s.pair.opening)}</p>`;}
if(s.mode==='versus'&&s.scene?.turn){const speaker=s.scene.turn==='simultaneous'?'Vous répondez tous les deux en secret.':`${playerName(s,Number(s.scene.turn.slice(-1)))} répond; l’autre observe.`;scene+=`<span class="mp-pill">${esc(speaker)}</span>`;}
if(isCoach){scene+=`<p class="mp-muted">Lis le dossier et partage ton interprétation avec ton ami. Il choisit la réponse.</p><div class="mp-dossier">${Object.entries(s.dossier||{}).filter(([k])=>k!=='name'&&k!=='age'&&k!=='job'&&k!=='face').map(([k,v])=>`<details><summary>${esc(({bio:'Profil',interests:'Centres d’intérêt',habits:'Habitudes',values:'Valeurs',sensitivities:'Sujets sensibles',flaw:'Angle mort',history:'Expérience passée',clues:'Indices',anecdote:'Anecdote',secret:'À découvrir'})[k]||k)}</summary><p class="mp-muted">${k==='scenes'?v.map(x=>`<span class=\"mp-pill\">${esc(x.prompt)}</span>`).join(' '):Array.isArray(v)?v.map(esc).join(' · '):esc(v)}</p></details>`).join('')}</div>`;}
else if(s.selected)scene+=`<p class="mp-wait">Réponse envoyée. Attends l’autre joueur…</p>`;
else if(s.mode==='versus'&&s.scene?.turn&&s.scene.turn!=='simultaneous'&&Number(s.scene.turn.slice(-1))!==room.role)scene+=`<p class="mp-wait">${s.lastReveal?.length?`Observe la réaction à la réponse précédente de ton adversaire.`:'Ton adversaire répond à cette question.'}</p>`;
else if(s.scene?.options)scene+=s.scene.options.map((o,i)=>`<button class="mp-choice" data-option="${esc(o.id)}"><b>${'ABC'[i]}.</b> ${esc(o.text)}</button>`).join('');
if(s.mode==='coach'&&s.deadline)scene+=`<p class="mp-timer" role="timer" data-deadline="${s.deadline}"></p>`;
scene+=revealHtml(s);scene+=`</div>${chatHtml(s)}`;
const roster=s.mode==='doubleDate'?`<div class="mp-people"><div class="mp-person"><b>${esc(playerName(s,0))}</b><br><span>${room.role===0?'Toi':'Ton partenaire'}</span></div><div class="mp-person"><img style="width:42px;height:42px;object-fit:cover;border-radius:50%;vertical-align:middle;margin-right:8px" src="${esc(s.profiles[0].photo)}" alt=""><b>${esc(room.role===0?'Ton rendez-vous':`Rendez-vous de ${playerName(s,0)}`)}</b><br><span>${esc(s.profiles[0].name)} · ${esc(s.profiles[0].job)}</span></div><div class="mp-person"><b>${esc(playerName(s,1))}</b><br><span>${room.role===1?'Toi':'Ton partenaire'}</span></div><div class="mp-person"><img style="width:42px;height:42px;object-fit:cover;border-radius:50%;vertical-align:middle;margin-right:8px" src="${esc(s.profiles[1].photo)}" alt=""><b>${esc(room.role===1?'Ton rendez-vous':`Rendez-vous de ${playerName(s,1)}`)}</b><br><span>${esc(s.profiles[1].name)} · ${esc(s.profiles[1].job)}</span></div></div>`:s.mode==='versus'?`<div class="mp-card"><img class="mp-photo" style="max-width:150px" src="${esc(s.profile.photo)}" alt="${esc(s.profile.name)}"><h2>${esc(s.profile.name)}, ${s.profile.age}</h2><p class="mp-muted">Joueur 1 et Joueur 2 se partagent la conversation.</p></div>`:'';
content().innerHTML=`<section class="mp-page">${peopleHtml(s)}<p class="mp-kicker">${s.mode==='coach'?(room.role===1?'DOSSIER DU COACH':'TON RENDEZ-VOUS'):'ENQUÊTE EN COURS'}</p><h1>${s.mode==='coach'&&room.role===1?`${esc(s.dossier.name)} · dossier`:'La conversation évolue'}</h1>${roster}${s.mode==='coach'&&room.role===0?`<p class="mp-pill">À toi : ${esc(s.observation)}</p>`:''}${s.mode==='coach'&&room.role===1?`<div class="mp-card"><img class="mp-photo" style="max-width:180px" src="${esc(s.targetImage)}"><h2>${esc(s.dossier.name)}, ${s.dossier.age}</h2><p>${esc(s.dossier.job)}</p></div>`:''}${scene}</section>`;
bindPlay(s);}
function revealHtml(s){return (s.lastReveal||[]).map(x=>`<div class="mp-result"><b>${esc(playerName(s,x.role))} :</b> « ${esc(x.text)} »<br><span>${esc(x.reply)}</span></div>`).join('');}
function bindPlay(s){
content().querySelector('#mp-contacts')?.addEventListener('click',()=>{close();window.openContacts?.();});content().querySelector('#mp-leave-room')?.addEventListener('click',leaveRoom);
content().querySelectorAll('[data-option]').forEach(b=>b.onclick=async()=>{try{await send({type:'answer',option:b.dataset.option,round:s.round,sceneId:s.scene.id});}catch(e){fail(e);}});bindChat();content().querySelector('#mp-rematch')?.addEventListener('click',async()=>{try{await send({type:'continue',value:s.rematchVotes?.[s.me]!=='lobby'});}catch(e){fail(e);}});content().querySelector('#mp-swap')?.addEventListener('click',async()=>{try{await send({type:'swapRoles',value:s.rematchVotes?.[s.me]!=='swap'});}catch(e){fail(e);}});}
let clientReceivedAt=Date.now();
function render(s){
 clientReceivedAt=Date.now();
 // Polling must not discard a message being typed or collapse the Coach dossier.
 const input=content().querySelector('#mp-chat-text');
 const draft=input?.value||'', focused=input===document.activeElement;
 const selection=input?[input.selectionStart,input.selectionEnd]:null;
 const preserved=[...content().querySelectorAll('[data-preserve]')].map(input=>({id:input.id,value:input.value,focused:input===document.activeElement}));
 const expanded=[...content().querySelectorAll('details[open]')].map(x=>x.querySelector('summary')?.textContent);
 window.LP_CONTACTS.remember(s);window.LP_CONTACTS.result(s);
 renderState(s);bindPeople(s);
 for(const field of preserved){const el=content().querySelector('#'+field.id);if(el){el.value=field.value;if(field.focused)el.focus();}}
 const next=content().querySelector('#mp-chat-text');
 if(next&&draft){next.value=draft;if(focused){next.focus();next.setSelectionRange(...selection);}}
 content().querySelectorAll('details').forEach(x=>{x.open=expanded.includes(x.querySelector('summary')?.textContent);});
}
function renderState(s){state=s;root.querySelector('.mp-head .mp-kicker').textContent=appName(s.mode||selectedApp);root.style.setProperty('--mp-venue-image',s.venue?`url("${s.venue.image}")`:'url("/solo/assets/restaurant-vide.webp")');if(typeof s.me==='number'&&room.role!==s.me){room.role=s.me;localStorage.setItem('lpdate-mp',JSON.stringify(room));}if(s.phase==='lobby'){renderLobby(s);return;}if(s.phase==='playing'){if(s.stage==='foxy'||s.stage==='venue'){renderSetup(s);return;}if(s.identifying){content().innerHTML=renderIdentification(s);if(!(s.mode==='coach'&&room.role===1))content().querySelectorAll('[data-seat]').forEach(b=>b.onclick=async()=>{try{await send({type:'identify',key:b.dataset.seat});}catch(e){fail(e);}});bindChat();return;}renderPlay(s);return;}home();}
setInterval(()=>{const el=content().querySelector('[data-deadline]');if(homeView||!el||!state?.deadline||document.hidden||!root.classList.contains('on'))return;const remaining=Math.max(0,Math.ceil((state.deadline-(Date.now()+(state.serverNow-clientReceivedAt)))/1000));el.textContent=`${remaining} s pour répondre · −2 affinité si le temps expire`;if(!remaining&&!sending)send({type:'timeout',round:state.round,sceneId:state.scene?.id}).catch(fail);},1000);
window.openMP=open;
const old=savedRoom('lpdate-mp');if(old)room=old;
})();
