(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(method,data)=>{const r=await fetch('/api/multiplayer',{method,headers:{'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(data)})});const j=await r.json();if(!r.ok)throw Error(j.error||'Erreur réseau');return j;};
let room=null,poll=null,state=null,lastHeartbeat=0;
let selectedApp='doubleDate',homeView=true;
const animatedRooms=new Set();
const appName=mode=>({doubleDate:'Foxy Duo',versus:'Foxy Versus',coach:'Blind Foxy'})[mode]||'Foxy Duo';
let generation=0, refreshing=false, sending=false;
let lastChange=Date.now(), failures=0;
function savedRoom(key){try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(!saved||!/^[A-Z0-9]{8}$/.test(saved.code)||!/^[a-f0-9-]{72}$/.test(saved.token)||(saved.expiresAt&&saved.expiresAt<=Date.now())){localStorage.removeItem(key);return null;}return saved;}catch{return null;}}
function unavailable(e){return /Salon introuvable ou expiré|Accès refusé|Jeton invalide/i.test(e?.message||'');}
function recoverRoom(e){
 if(!unavailable(e))return false;
 const code=room?.code;
 for(const key of ['lpdate-mp','lpdate-mp-recovery'])if(savedRoom(key)?.code===code)localStorage.removeItem(key);
 room=null;state=null;generation++;clearTimeout(poll);poll=null;failures=0;home();
 content().insertAdjacentHTML('afterbegin','<p class="mp-notice" role="status">Ce salon n’est plus disponible. Crée un nouveau salon et partage son code, ou rejoins celui de ton ami. Tes contacts et statistiques sont conservés.</p>');
 return true;
}
const root=document.createElement('div');root.id='mp-overlay';root.innerHTML=`<div class="mp-shell"><header class="mp-head"><span class="mp-kicker">FOXY DUO · RENDEZ-VOUS EN LIGNE</span><button class="mp-close" aria-label="Fermer">×</button></header><main id="mp-content"></main></div>`;document.body.append(root);
const style=document.createElement('style');style.textContent=`#mp-overlay{position:fixed;z-index:99999;inset:0;background:rgba(14,10,13,.92);backdrop-filter:blur(18px);display:none;overflow:auto;color:#f9f0ed;font-family:inherit}#mp-overlay.on{display:block}.mp-shell{width:min(900px,100%);min-height:100dvh;margin:auto;padding:clamp(16px,4vw,38px);box-sizing:border-box}.mp-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff25;padding-bottom:14px}.mp-kicker{letter-spacing:.16em;font-size:11px;color:#efb6ae}.mp-close{border:0;background:#ffffff18;color:white;border-radius:50%;width:38px;height:38px;font-size:25px;cursor:pointer}.mp-page{padding:22px 0}.mp-page h1{font-size:clamp(28px,5vw,48px);line-height:1.05;margin:8px 0 12px}.mp-page h2{margin:6px 0 10px}.mp-muted{color:#c9b9bb;line-height:1.5}.mp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:20px 0}.mp-card{background:#251b22;border:1px solid #ffffff1c;border-radius:18px;padding:17px}.mp-btn{border:0;border-radius:12px;padding:13px 16px;margin:5px 6px 5px 0;background:#f2b9ae;color:#26151b;font-weight:750;cursor:pointer}.mp-btn.secondary{background:#ffffff18;color:#fff;border:1px solid #ffffff24}.mp-btn:disabled{opacity:.45}.mp-input{background:#151115;color:white;border:1px solid #ffffff38;border-radius:11px;padding:12px;font:inherit;max-width:170px;text-transform:uppercase}.mp-code{font-size:30px;font-weight:850;letter-spacing:.22em;color:#ffd5c6}.mp-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin:18px 0}.mp-mode{background:#281d25;border:1px solid #ffffff25;border-radius:15px;padding:16px;text-align:left;color:white;cursor:pointer}.mp-mode.selected{outline:2px solid #f2b9ae}.mp-people,.mp-candidates{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.mp-person{flex:1;min-width:160px;background:#241a20;border-radius:15px;padding:13px}.mp-photo{width:100%;max-height:270px;object-fit:cover;border-radius:14px}.mp-candidate{width:min(30%,180px);min-width:95px;background:#241a20;color:white;border:1px solid #ffffff30;border-radius:14px;padding:7px;cursor:pointer}.mp-candidate img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block}.mp-candidate span{display:block;padding:7px 3px 3px;font-size:11px;color:#d0c1c3}.mp-scene{background:#261d24;border-radius:20px;padding:20px;margin:18px 0}.mp-question{font-size:21px;line-height:1.45}.mp-choice{display:block;width:100%;text-align:left;background:#382a34;color:white;border:1px solid #ffffff22;border-radius:13px;padding:14px;margin:9px 0;cursor:pointer;font:inherit}.mp-choice:hover{border-color:#f2b9ae}.mp-result{background:#18302a;border-radius:13px;padding:13px;margin:8px 0}.mp-chat{display:grid;grid-template-columns:1fr auto;gap:8px;margin:15px 0}.mp-chat input{width:100%;box-sizing:border-box;background:#171217;border:1px solid #ffffff30;border-radius:10px;color:white;padding:11px;font:inherit}.mp-messages{max-height:140px;overflow:auto;color:#e5d5d8;font-size:13px}.mp-error{color:#ffd1c7;background:#512d37;border-radius:10px;padding:10px;margin:12px 0}.mp-pills{display:flex;gap:8px;flex-wrap:wrap}.mp-pill{padding:7px 10px;border-radius:999px;background:#ffffff17;color:#e9d8da;font-size:12px}.mp-dossier details{background:#251b22;border-radius:12px;padding:12px;margin:8px 0}.mp-dossier summary{cursor:pointer;font-weight:bold}.mp-wait{padding:12px;color:#ffe0d4}.mp-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:14px}@media(max-width:560px){.mp-page{padding-top:14px}.mp-grid{grid-template-columns:1fr}.mp-photo{max-height:220px}.mp-question{font-size:18px}}`;
document.head.append(style);
const content=()=>root.querySelector('#mp-content');const open=(mode='doubleDate')=>{selectedApp=mode;root.querySelector('.mp-head .mp-kicker').textContent=appName(mode);root.classList.add('on');generation++;clearTimeout(poll);home();};const close=()=>{root.querySelector('dialog')?.close();root.classList.remove('on');clearTimeout(poll);poll=null;generation++;};root.querySelector('.mp-close').onclick=close;
function fail(e){const old=content().querySelector('.mp-error');if(old)old.remove();content().insertAdjacentHTML('afterbegin',`<div class="mp-error">${esc(e.message||e)}</div>`);}
function home(){
 homeView=true;state=null;root.classList.remove('mp-at-date');
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
function enter(r){homeView=false;generation++;lastHeartbeat=Date.now();lastChange=Date.now();failures=0;state=null;room={code:r.code,token:r.token,role:r.role,expiresAt:r.expiresAt};localStorage.setItem('lpdate-mp',JSON.stringify(room));}
function auth(){if(!room)throw Error('Rejoins ou crée un salon.');return {code:room.code,token:room.token};}
async function send(action){
 if(action.duoRevision===undefined&&state?.foxy?.revision!==undefined&&['location','likeProfile','confirmMatch','venue','confirmVenue','duoChange'].includes(action.type))action={...action,duoRevision:state.foxy.revision};
 if(sending||!room||homeView)return;
 const session=room, ticket=++generation;
 sending=true;
 content().querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  const s=await api('POST',{...auth(),action});
  if(room===session&&generation===ticket){lastHeartbeat=Date.now();lastChange=Date.now();failures=0;render(s);}
  return s;
 }catch(e){
  if(room===session&&generation===ticket){
   if(recoverRoom(e))return null;
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
 catch(e){if(room===session&&generation===ticket){if(!recoverRoom(e)){failures++;fail(e);}}}
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
let browseIndex=0,browseMatch=null,browseDetails=null;const duoMembers=new Map();
function duoChangeHtml(s){const f=s.foxy;if(!f?.locked)return '';const votes=f.changeVotes||[false,false];return `<div class="mp-duo-change"><p>${votes[1-s.me]?`${esc(playerName(s,1-s.me))} propose de choisir un autre duo.`:votes[s.me]?'Demande envoyée : ton ami doit aussi accepter pour changer.':'Ce duo ne vous tente plus ? Vous pouvez en choisir un autre ensemble.'}</p><button class="mp-btn secondary" data-duo-change="${votes[s.me]?'false':'true'}">${votes[s.me]?'Annuler ma demande':votes[1-s.me]?'Accepter de changer de duo':'Proposer un autre duo'}</button></div>`;}
function bindDuoChange(){content().querySelector('[data-duo-change]')?.addEventListener('click',async e=>{try{await send({type:'duoChange',value:e.currentTarget.dataset.duoChange==='true'});}catch(err){fail(err);}});}

function renderInvitation(s){
 const invitation=s.invitation;
 content().innerHTML=`<section class="mp-page"><div class="mp-foxy-phone mp-invitation-phone"><div class="mp-foxy-notch"></div><div class="mp-phone-notification" role="status">♥ ${esc(appName(s.mode))} · Nouveau message</div><div class="mp-foxy-body"><h2>${s.mode==='doubleDate'?'Votre conversation de groupe':'Votre rendez-vous'}</h2><div class="mp-foxy-thread">${invitation.messages.map(m=>`<article><small>${esc(m.speaker)}</small><p>${esc(m.text)}</p></article>`).join('')}</div><button class="mp-btn" id="mp-ack-invitation" ${invitation.ready?'disabled':''}>${invitation.ready?'On attend ton ami…':'C’est parti →'}</button></div></div></section>`;
 content().querySelector('#mp-ack-invitation').onclick=async()=>{try{await send({type:'ackInvitation',invitationId:invitation.id});}catch(e){fail(e);}};
}
function renderSetup(s){
 if(browseMatch!==s.matchId){browseIndex=0;browseMatch=s.matchId;browseDetails=null;}
 if(s.stage==='venue'&&s.mode==='coach'){
  content().innerHTML=`<section class="mp-page"><p class="mp-kicker">BLIND FOXY · L’INVITATION</p><h1>Où l’emmènes-tu ?</h1><p class="mp-muted">Ton Coach connaît son profil. Écoute ses conseils, puis choisis une adresse : elle vous répondra sur Foxy avant de partir.</p><div class="mp-venue-grid">${s.venues.map(v=>`<button class="mp-venue-card" data-blind-venue="${esc(v.id)}"><img src="${esc(v.image)}" alt=""><div><b>${esc(v.name)}</b><small>${esc(v.tag)}</small></div></button>`).join('')}</div>${chatHtml(s)}</section>`;
  content().querySelectorAll('[data-blind-venue]').forEach(b=>b.onclick=async()=>{try{await send({type:'chooseVenue',venueId:b.dataset.blindVenue});}catch(e){fail(e);}});bindChat();return;
 }
 if(s.stage==='venue'){
  content().innerHTML=`<section class="mp-page"><p class="mp-kicker">${s.mode==='versus'?'FOXY VERSUS · L’INVITATION':'DEUX MATCHS · UNE SOIRÉE'}</p><h1>Où on se retrouve ?</h1>${peopleHtml(s)}<p class="mp-muted">Proposez ensemble une adresse. Votre match vous répondra sur Foxy.</p><div class="mp-venue-grid">${s.venues.map(v=>`<button class="mp-venue-card ${s.venueVotes[s.me]===v.id?'selected':''}" data-venue="${v.id}"><img src="${v.image}" alt=""><div><b>${esc(v.name)}</b><small>${esc(v.tag)}</small>${[0,1].filter(role=>s.venueVotes[role]===v.id).map(role=>`<small>♥ ${esc(playerName(s,role))}</small>`).join('')}</div></button>`).join('')}</div><button class="mp-btn" id="mp-confirm-venue" ${!s.venueVotes[s.me]||s.venueConfirmed[s.me]||s.foxy?.changeVotes?.some(Boolean)?'disabled':''}>${s.venueConfirmed[s.me]?'Lieu confirmé · en attente de ton ami':'Valider ce lieu'}</button>${duoChangeHtml(s)}${chatHtml(s)}</section>`;
  bindDuoChange();content().querySelector('#mp-confirm-venue').onclick=async()=>{try{await send({type:'confirmVenue'});}catch(e){fail(e);}};
  content().querySelectorAll('[data-venue]').forEach(b=>b.onclick=async()=>{try{await send({type:'venue',venueId:b.dataset.venue});}catch(e){fail(e);}});bindChat();return;
 }
 const f=s.foxy,card=f.profiles[browseIndex%f.profiles.length];
 const member=!f.locked&&card.duo?card.duo.members.find(x=>x.id===(duoMembers.get(card.duo.id)||card.id)):null;
 const p=member?{...member,duo:card.duo}:card;
 const pairHeader=p.duo?`<div class="mp-duo-heading"><h2>${esc(p.duo.names)}</h2><p>${esc(p.duo.relation)}</p><div class="mp-duo-members">${p.duo.members.map(person=>`<button type="button" data-duo-person="${esc(person.id)}" ${f.locked?'disabled':''} class="${person.id===p.id?'selected':''}"><img src="${esc(person.photo)}" alt=""><span>${esc(person.name)}</span></button>`).join('')}</div></div>`:'';
 const proposal=f.locked&&f.partnerLiked?`<p class="mp-duo-proposal">${esc(playerName(s,1-s.me))} a choisi ${esc(f.proposal.chosenName)}. Pour ce duo, ton match est ${esc(f.proposal.expectedName)}. Tu peux lire son profil et accepter, ou proposer de changer ensemble.</p>`:'';
 if(browseDetails===p.id&&f.step!=='location'){
  content().innerHTML=`<section class="mp-page">${pairHeader}${proposal}${profileReference({mode:'doubleDate',profile:p})}<div class="mp-profile-actions"><button class="mp-btn secondary" id="mp-profile-back">← ${f.liked?'Mon match':'Les profils'}</button>${!f.liked?`<button class="mp-btn" id="mp-detail-like">♥ J’aime ce profil</button>`:`<button class="mp-btn" id="mp-detail-confirm" ${f.confirmed||f.changeVotes?.some(Boolean)?'disabled':''}>${f.confirmed?'Prêt · on attend ton ami':'Prêt pour le rendez-vous'}</button>`}</div>${duoChangeHtml(s)}</section>`;
  bindDuoChange();content().querySelectorAll('[data-duo-person]').forEach(b=>b.onclick=()=>{duoMembers.set(p.duo.id,b.dataset.duoPerson);browseDetails=b.dataset.duoPerson;render(s);});content().querySelector('#mp-profile-back').onclick=()=>{browseDetails=null;render(s);};
  content().querySelector('#mp-detail-like')?.addEventListener('click',async()=>{try{browseDetails=null;await send({type:'likeProfile',profileId:p.id,duoRevision:f.revision});}catch(e){fail(e);}});
  content().querySelector('#mp-detail-confirm')?.addEventListener('click',async()=>{try{browseDetails=null;await send({type:'confirmMatch'});}catch(e){fail(e);}});return;
 }
 const header=`<div class="mp-foxy-top"><img src="/solo/assets/foxy-mascot.webp" alt=""><div><b>Foxy</b><small>DOUBLE DATE · ${esc(playerName(s,s.me))}</small></div></div>`;
 let body;
 if(f.step==='location')body=`<p class="mp-kicker">PREMIÈRE OUVERTURE</p><h1>Où tu cherches ?</h1><p class="mp-muted">Entre ta ville pour préparer ton profil. Ton partenaire renseigne la sienne sur son téléphone.</p><label for="mp-city">Ta ville ou ton village</label><input class="mp-input" data-preserve id="mp-city" maxlength="48" placeholder="Ex. Roquemaure" value="${esc(f.city)}"><button class="mp-btn" id="mp-city-next">Continuer sur Foxy</button>`;
 else if(f.step==='waiting')body=`<div class="mp-match-heart">♥</div><h1>Match !</h1><p class="mp-muted">${esc(p.name)} a aimé ton profil. ${f.partnerLiked?'Ton partenaire a aussi validé son match.':f.locked?`On attend que ${esc(playerName(s,1-s.me))} accepte ${esc(p.duo.members.find(x=>x.id!==p.id).name)} pour compléter votre duo.`:`On attend que ${esc(playerName(s,1-s.me))} trouve aussi son match.`}</p><img class="mp-photo" src="${p.photo}" alt="${esc(p.name)}"><p class="mp-location-label">⌖ ${esc(f.city)}</p><p>${esc(p.bio)}</p><button class="mp-btn secondary" id="mp-review-match">Revoir son profil complet</button><button class="mp-btn" id="mp-confirm-match" ${f.confirmed||f.changeVotes?.some(Boolean)?'disabled':''}>${f.confirmed?'Prêt · en attente de ton ami':'Je suis prêt pour le rendez-vous'}</button>`;
 else body=`${pairHeader}${proposal}<p class="mp-location-label">⌖ ${esc(f.city)} · autour de toi</p><div class="mp-foxy-card" data-profile-id="${p.id}"><img src="${p.photo}" alt="${esc(p.name)}"><div class="mp-foxy-caption"><h2>${esc(p.name)}, ${p.age}</h2><p>${esc(p.job)}</p><p>${esc(p.bio)}</p><div class="mp-pills">${p.interests.map(x=>`<span class="mp-pill">${esc(x)}</span>`).join('')}</div></div></div><button class="mp-btn secondary" id="mp-view-profile">Voir son profil complet ↓</button><div class="mp-swipe-actions"><button class="mp-btn secondary" id="mp-pass-profile" ${f.locked?'disabled':''} aria-label="Duo suivant">×</button><button class="mp-btn" id="mp-like-profile" data-profile="${p.id}" aria-label="J'aime ce profil">♥</button></div><p class="mp-muted">${p.duo?(f.locked?'Un duo proposé. Chacun doit accepter sa partenaire.':`${f.profiles.length} duos à parcourir · 8 profils. Choisis qui tu souhaites rencontrer dans ce duo.`):`${f.profiles.length} profils à parcourir.`}</p>`;
 content().innerHTML=`<section class="mp-page">${peopleHtml(s)}<div class="mp-foxy-phone">${header}<div class="mp-foxy-body" data-foxy-step="${f.step}">${body}${duoChangeHtml(s)}</div></div>${chatHtml(s)}</section>`;
 bindDuoChange();content().querySelectorAll('[data-duo-person]').forEach(b=>b.onclick=()=>{duoMembers.set(p.duo.id,b.dataset.duoPerson);browseDetails=null;render(s);});
 for(const id of ['mp-view-profile','mp-review-match'])content().querySelector('#'+id)?.addEventListener('click',()=>{browseDetails=p.id;render(s);});
 content().querySelector('#mp-confirm-match')?.addEventListener('click',async()=>{try{await send({type:'confirmMatch'});}catch(e){fail(e);}});
 content().querySelector('#mp-city-next')?.addEventListener('click',async()=>{try{await send({type:'location',city:content().querySelector('#mp-city').value});}catch(e){fail(e);}});
 content().querySelector('#mp-city')?.addEventListener('keydown',e=>{if(e.key==='Enter')content().querySelector('#mp-city-next').click();});
 content().querySelector('#mp-pass-profile')?.addEventListener('click',()=>{browseIndex++;render(s);});
 content().querySelector('#mp-like-profile')?.addEventListener('click',async()=>{try{await send({type:'likeProfile',profileId:p.id,duoRevision:f.revision});}catch(e){fail(e);}});bindChat();
}
function candidateHtml(s,clickable=true){return (s.seats||[]).map((x,i)=>`${clickable?`<button class="mp-candidate" data-seat="${esc(x.key)}">`:`<article class="mp-candidate">`}<img src="${esc(x.image)}" alt="Personne ${i+1}"><span>TABLE ${String(i+1).padStart(2,'0')}</span>${x.cue?`<small>${esc(x.cue)}</small>`:''}${clickable?'</button>':'</article>'}`).join('');}
function chatHtml(s){return `<div class="mp-card"><b>Parler à ${esc(playerName(s,1-s.me))}</b><div class="mp-messages">${(s.chat||[]).map(x=>`<p><b>${x.role===room.role?'Toi':esc(playerName(s,x.role))} :</b> ${esc(x.text)}</p>`).join('')}</div><form class="mp-chat" id="mp-chat-form"><input id="mp-chat-text" maxlength="280" placeholder="Écris un indice ou une observation…"><button class="mp-btn">Envoyer</button></form></div>`;}
function bindChat(){const form=content().querySelector('#mp-chat-form');if(form)form.onsubmit=async e=>{e.preventDefault();const i=content().querySelector('#mp-chat-text');if(!i.value.trim()||sending)return;try{await send({type:'chat',text:i.value});const next=content().querySelector('#mp-chat-text');if(next)next.value='';}catch(err){fail(err);}};}
const profilePhotos=new Map();
function profileReference(s){
 const p=s.mode==='coach'?s.dossier:s.profiles?.find(p=>p.mine)||s.profile;
 if(!p)return '';
 const photos=p.photos?.length?p.photos:[s.mode==='coach'?s.targetImage:p.photo],key=p.id||p.name,index=(profilePhotos.get(key)||0)%photos.length;
 return `<div class="mp-foxy-phone mp-reference-phone"><div class="mp-foxy-top"><img src="/solo/assets/foxy-mascot.webp" alt=""><div><b>Foxy</b><small>${s.mode==='coach'?'DOSSIER PRIVÉ · COACH':'PROFIL FOXY'}</small></div></div><div class="mp-profile-gallery" data-profile-gallery="${esc(key)}" data-photos="${esc(JSON.stringify(photos))}" data-name="${esc(p.name)}"><img class="mp-photo mp-reference-portrait" src="${esc(photos[index])}" alt="Photo ${index+1} de ${esc(p.name)}"><div class="mp-gallery-controls"><button class="mp-btn secondary" data-gallery-prev aria-label="Photo précédente">‹</button><span data-gallery-count>${index+1} / ${photos.length}</span><button class="mp-btn secondary" data-gallery-next aria-label="Photo suivante">›</button></div></div><div class="mp-foxy-body"><h2>${esc(p.name)}, ${p.age}</h2><p>${esc(p.job)}</p><p>${esc(p.bio)}</p><div class="mp-pills">${(p.interests||[]).map(i=>`<span class="mp-pill">${esc(i)}</span>`).join('')}</div><div class="mp-profile-questions">${(p.questions||[]).map(q=>`<article class="mp-profile-prompt"><small>${esc(q.question)}</small><p>${esc(q.answer)}</p></article>`).join('')}</div></div></div>`;
}
function bindProfiles(){content().querySelectorAll('[data-profile-gallery]').forEach(gallery=>{
 const photos=JSON.parse(gallery.dataset.photos),key=gallery.dataset.profileGallery;
 const show=delta=>{const index=((profilePhotos.get(key)||0)+delta+photos.length)%photos.length;profilePhotos.set(key,index);const img=gallery.querySelector('img');img.src=photos[index];img.alt=`Photo ${index+1} de ${gallery.dataset.name}`;gallery.querySelector('[data-gallery-count]').textContent=`${index+1} / ${photos.length}`;};
 gallery.querySelector('[data-gallery-prev]').onclick=()=>show(-1);gallery.querySelector('[data-gallery-next]').onclick=()=>show(1);
 });}
function dateActors(s){
 const p=s.actor||s.profiles?.find(p=>p.mine)||s.profile;
 if(!p)return '';
 return `<div class="mp-restaurant-scene ${s.animation==='cheat'?'mp-pool-action':''}" data-space="${esc(s.space||'table')}" data-venue="${esc(s.venue?.id||'luxury')}" aria-label="${esc(s.venue?.name||'Le restaurant')}"><div class="mp-window-light"></div><div class="mp-date-actor ${esc(s.actor?.mood||'neutral')}" data-actor><img src="${esc(p.photo)}" alt="${esc(p.name)}" data-actor-image><span>${esc(p.name)}</span></div><div class="mp-restaurant-table" aria-hidden="true"></div>${s.animation==='cheat'?'<div class="mp-cheat-demo" aria-label="Une main déplace discrètement une boule de billard"><span class="mp-pool-pocket"></span><span class="mp-moving-ball">8</span><span class="mp-moving-hand">☞</span></div>':''}</div>`;
}
function renderIdentification(s){
 const coach=s.mode==='coach'&&s.me===1;
 if(coach)return `<section class="mp-page mp-coach-intro"><p class="mp-kicker">BLIND FOXY · TON AMI NE VOIT PAS CE PROFIL</p><h1>${s.stage==='venue'?'Aide-le à choisir le lieu.':s.identifying?'Décris-lui ton match.':'Ton ami compte sur toi.'}</h1><p class="mp-muted">${s.stage==='venue'?'Toi seul as son profil. Regarde ce qui lui plaît et conseille une adresse à ton ami. C’est lui qui l’invite et choisit le lieu.':s.identifying?'Toi seul as son profil. Ton ami voit quatre personnes : décris-lui la candidate à la voix.':'Ton ami vit le rendez-vous. Il te raconte ce qui se passe ; parcours son profil pour réfléchir avec lui. Le contexte compte autant que les indices.'}</p>${profileReference(s)}${chatHtml(s)}</section>`;
 const reference=s.mode==='coach'?'':`<details class="mp-pocket-profile"><summary>Revoir son profil</summary>${profileReference(s)}</details>`;
 const heading=s.identified?'Tu as choisi.':'Laquelle est ton rendez-vous ?';
 return `<section class="mp-page mp-arrival"><p class="mp-kicker">${esc(s.venue?.name||'LE RESTAURANT')} · RECONNAISSANCE</p><h1>${heading}</h1><p class="mp-muted">${s.identified?`Attends que ${esc(playerName(s,1-s.me))} ait aussi reconnu son match.`:s.mode==='coach'?'Ton Coach a la vraie photo. Écoute ses indices pour choisir parmi les quatre personnes.':'Chacun cherche sa partenaire parmi quatre personnes. Vos choix se font séparément.'}</p>${reference}${s.identified?'':`<div class="mp-tableau"><div class="mp-candidates">${candidateHtml(s)}</div></div>`}${chatHtml(s)}</section>`;
}
function renderPlay(s){
if(s.ending){
 const votes=s.rematchVotes||[null,null],own=votes[s.me];
 content().innerHTML=`<section class="mp-page">${peopleHtml(s)}<p class="mp-kicker">FIN DU RENDEZ-VOUS · ${esc(modeName(s.mode))}</p><h1>${esc(s.ending.replace(/joueur ([12])/g,(_,number)=>playerName(s,Number(number)-1)))}</h1>${revealHtml(s)}${s.result?.dates?.length?`<p class="mp-muted">♥ ${s.result.dates.map(p=>esc(p.name)).join(', ')} rejoint tes contacts.</p>`:''}<div class="mp-votes"><b>On remet ça ?</b>${[0,1].map(role=>`<div class="mp-vote-line"><span>${esc(playerName(s,role))}</span><span>${votes[role]==='swap'?'Inverser les rôles':votes[role]==='lobby'?'Retour au salon':'Pas encore voté'}</span></div>`).join('')}<p class="mp-muted">Vous devez choisir tous les deux la même option pour rejouer.</p></div><button class="mp-btn" id="mp-rematch">${own==='lobby'?'Annuler mon vote':'Voter pour rejouer'}</button>${s.mode==='coach'?`<button class="mp-btn secondary" id="mp-swap">${own==='swap'?'Annuler mon vote':'Voter pour inverser les rôles'}</button>`:''}<button class="mp-btn secondary" id="mp-contacts">Voir mes contacts</button><button class="mp-btn secondary" id="mp-leave-room">Quitter ce salon</button>${chatHtml(s)}</section>`;bindPlay(s);return;
}
const isCoach=s.mode==='coach'&&s.me===1;
let scene=`<div class="mp-scene" data-round="${s.round}">`;
if(s.reaction){scene+=`${revealHtml(s)}<button class="mp-btn mp-next" id="mp-next-scene" data-reaction="${esc(s.reaction.id)}" ${s.reaction.ready?'disabled':''}>${s.reaction.ready?'Prêt · on attend ton ami…':'Continuer →'}</button><p class="mp-muted">${s.mode==='coach'?'Prends le temps de lire sa réaction avant de poursuivre.':'Vous passez à la suite lorsque vous avez tous les deux fini de lire.'}</p>`;}
else{
 if(s.arrivalNotice)scene+=`<p class="mp-notice">${esc(s.arrivalNotice)}</p>`;
 scene+=`${s.scene?.transition?`<p class="mp-transition">${esc(s.scene.transition)}</p>`:''}<p class="mp-question">${esc(s.scene?.prompt||'Le rendez-vous reprend…')}</p>`;
 if(s.mode==='versus'&&s.scene?.turn)scene+=`<span class="mp-pill">${esc(s.scene.turn==='simultaneous'?'Vous répondez tous les deux en secret.':`${playerName(s,Number(s.scene.turn.slice(-1)))} répond ; l’autre écoute.`)}</span>`;
 if(isCoach)scene+=`<p class="mp-coach-guide">Aide ton ami à faire le lien avec son profil. Parlez sur Discord ; c’est lui qui choisit sa réponse.</p>`;
 else if(s.selected)scene+=`<p class="mp-wait">Réponse envoyée. Attends l’autre joueur…</p>`;
 else if(s.mode==='versus'&&s.scene?.turn!=='simultaneous'&&Number(s.scene?.turn?.slice(-1))!==s.me)scene+=`<p class="mp-wait">Ton adversaire répond. Tu découvres sa réponse ensuite.</p>`;
 else scene+=(s.scene?.options||[]).map((o,i)=>`<button class="mp-choice" data-option="${esc(o.id)}"><b>${'ABC'[i]}.</b> ${esc(o.text)}</button>`).join('');
 if(s.mode==='coach'&&s.deadline)scene+=`<p class="mp-timer" role="timer" data-deadline="${s.deadline}"></p>`;
}
scene+='</div>';
content().innerHTML=`<section class="mp-page mp-live-date"><div class="mp-date-top"><span>${esc(s.venue?.name||'LE RESTAURANT')}</span><small>${esc(playerName(s,s.me))}${isCoach?' · Coach':''}</small></div>${s.sharedMoment?`<p class="mp-shared-moment">${esc(s.sharedMoment)}</p>`:''}${dateActors(s)}<div class="mp-conversation">${scene}</div>${isCoach?`<aside class="mp-coach-phone"><h2>Son profil Foxy</h2>${profileReference(s)}</aside>`:s.mode==='doubleDate'?`<details class="mp-pocket-profile"><summary>Mon téléphone · revoir son profil</summary>${profileReference(s)}</details>`:''}<details class="mp-chat-pocket"><summary>Parler à ${esc(playerName(s,1-s.me))}</summary>${chatHtml(s)}</details></section>`;
bindPlay(s);animateActor(s);requestAnimationFrame(fitDate);}
// Keep the entire decision above the fold. Extra profile/chat tools stay below.
function fitDate(){
 const stage=content().querySelector('.mp-restaurant-scene'),dialogue=content().querySelector('.mp-conversation');if(!stage||!dialogue)return;
 const top=stage.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop;
 const available=root.clientHeight-top-dialogue.getBoundingClientRect().height-12;
 stage.style.height=`${Math.max(64,Math.min(root.clientHeight*.33,available))}px`;
}
window.addEventListener('resize',()=>requestAnimationFrame(fitDate));
const actorReactions=new Map();let actorTimer;
function animateActor(s){
 clearTimeout(actorTimer);const image=content().querySelector('[data-actor-image]'),actor=s.actor;
 if(!image||!actor?.transient)return;
 const now=Date.now(),key=actor.transient.id;if(!actorReactions.has(key))actorReactions.set(key,now);
 if(actorReactions.size>100)actorReactions.delete(actorReactions.keys().next().value);
 const remaining=2000-(now-actorReactions.get(key));if(remaining<=0)return;
 image.src=actor.transient.photo;image.closest('[data-actor]').classList.add('mp-reacting');
 actorTimer=setTimeout(()=>{if(image.isConnected){image.src=actor.photo;image.closest('[data-actor]').classList.remove('mp-reacting');}},remaining);
}
function revealHtml(s){if(s.story)return (s.lastReveal||[]).map(x=>`<div class="mp-result" aria-live="polite"><small>${esc(x.speaker||'')}</small><p class="mp-spoken-reply">${esc(x.reply)}</p></div>`).join('');return (s.lastReveal||[]).map(x=>`<div class="mp-result" aria-live="polite"><small>${esc(playerName(s,x.role))} a répondu</small><p class="mp-spoken-choice">« ${esc(x.text)} »</p><small>${esc(x.speaker||s.dossier?.name||s.actor?.name||s.profiles?.find(p=>p.mine)?.name||s.profile?.name||'Ton rendez-vous')}</small><p class="mp-spoken-reply">${esc(x.reply)}</p></div>`).join('');}

function bindPlay(s){
 content().querySelector('#mp-next-scene')?.addEventListener('click',async()=>{try{await send({type:'nextScene',sceneId:s.scene?.id,reactionId:s.reaction?.id});}catch(e){fail(e);}});
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
 const previousStage=state?.stage,scroll=root.scrollTop;renderState(s);bindPeople(s);bindProfiles();if(s.mode==='coach'&&s.me===1||previousStage===s.stage)root.scrollTop=scroll;
 for(const field of preserved){const el=content().querySelector('#'+field.id);if(el){el.value=field.value;if(field.focused)el.focus();}}
 const next=content().querySelector('#mp-chat-text');
 if(next&&draft){next.value=draft;if(focused){next.focus();next.setSelectionRange(...selection);}}
 content().querySelectorAll('details').forEach(x=>{x.open=expanded.includes(x.querySelector('summary')?.textContent);});
}
function renderState(s){state=s;root.classList.toggle('mp-at-date',s.phase==='playing'&&!['foxy','venue','invitation'].includes(s.stage));root.querySelector('.mp-head .mp-kicker').textContent=appName(s.mode||selectedApp);root.style.setProperty('--mp-venue-image',s.backdrop?`url("${s.backdrop}")`:s.venue?`url("${s.venue.image}")`:'url("/solo/assets/restaurant-vide.webp")');if(typeof s.me==='number'&&room.role!==s.me){room.role=s.me;localStorage.setItem('lpdate-mp',JSON.stringify(room));}if(s.phase==='lobby'){renderLobby(s);return;}if(s.phase==='playing'){if(s.mode==='coach'&&s.me===1&&!s.ending){content().innerHTML=renderIdentification(s);bindChat();return;}if(s.stage==='invitation'){renderInvitation(s);return;}if(s.stage==='foxy'||s.stage==='venue'){renderSetup(s);return;}if(s.identifying){content().innerHTML=renderIdentification(s);if(!(s.mode==='coach'&&room.role===1))content().querySelectorAll('[data-seat]').forEach(b=>b.onclick=async()=>{try{await send({type:'identify',key:b.dataset.seat});}catch(e){fail(e);}});bindChat();return;}renderPlay(s);return;}home();}
setInterval(()=>{const el=content().querySelector('[data-deadline]');if(homeView||!el||!state?.deadline||document.hidden||!root.classList.contains('on'))return;const remaining=Math.max(0,Math.ceil((state.deadline-(Date.now()+(state.serverNow-clientReceivedAt)))/1000));el.textContent=`${remaining} s pour répondre`;if(!remaining&&!sending)send({type:'timeout',round:state.round,sceneId:state.scene?.id}).catch(fail);},1000);
window.openMP=open;
const old=savedRoom('lpdate-mp');if(old)room=old;
})();
