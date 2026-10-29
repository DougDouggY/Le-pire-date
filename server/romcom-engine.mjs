import { CONTENT, getProfile, publicProfile } from './content.mjs';
import { SPRITES, moodFor } from './date-presentation.mjs';
import { VENUES } from './social.mjs';
import { PREFERRED_VENUES, storyScenes } from './romcom-content.mjs';
export { storyScenes };
const profileFor=(m,r)=>getProfile(m.mode,m.mode==='doubleDate'?m.pair.profiles[r]:m.profileId);
const name=(room,r)=>room.participants?.[r]?.name||`Joueur ${r+1}`;
const substitute=(text,room,r)=>text.replaceAll('{me}',name(room,r)).replaceAll('{other}',name(room,1-r));
export function storyScene(room,role){
 const m=room.match,s=structuredClone(storyScenes(m,role)[m.round]);if(!s)return null;
 const mine=m.mode==='doubleDate'?(s.turn==='other'?1-role:role):s.turn?.startsWith('player')?Number(s.turn.at(-1)):null;
 s.actor=mine;s.prompt=substitute(s.prompt,room,mine??role);
 // A testimony is addressed to the other date. Both sides have an actual turn.
 if(m.mode==='doubleDate'&&m.round===3)s.active=role===0;
 else if(m.mode==='doubleDate'&&m.round===4)s.active=role===1;
 else s.active=mine===null||mine===role;
 if(m.mode==='doubleDate'&&[3,4].includes(m.round)){
  const first=profileFor(m,1),second=profileFor(m,1);
  const target=m.round===3?first:second;
  const source=storyScenes(m,1)[m.round];Object.assign(s,structuredClone(source));
  s.prompt=substitute(source.prompt,room,1);s.speaker=target.id;s.actor=m.round===3?0:1;s.active=role===s.actor;
 }
 if(m.mode==='versus'&&m.round===3){const prior=m.history?.find(x=>x.round===2);if(prior)s.transition=`${name(room,0)} vient de dire : « ${prior.text} »`;}
 if(m.mode==='doubleDate'&&m.round===4){const prior=m.history?.find(x=>x.round===3);if(prior)s.transition=`${name(room,0)} vient de dire : « ${prior.text} »`;}
 // A physical detail can return later; memories never manufacture unseen events.
 if(m.mode==='doubleDate'&&m.round===5&&m.pair.profiles[role]==='dd-naima'){
  if(m.memories.some(x=>x.tag==='naima-bluff')){s.prompt='La petite pièce est un écrou de fixation, pas un cache. « On vérifie avant que je remonte dessus ? »';s.options[1].reply='Après ton diagnostic de tout à l’heure, je préfère regarder maintenant.';}
  else if(m.memories.some(x=>x.tag==='naima-check'))s.transition='Naïma ressort la petite pièce. Vous aviez prévu de regarder avant son départ.';
 }
 if(m.mode==='coach'&&m.profileId==='coach-katell'&&m.round===4&&m.memories.some(x=>x.tag==='katell-weather'))s.transition='Katell revient à ta réserve sur la météo : « On évitera les jours de pluie. Mais il reste un autre horaire à regarder. »';
 return s;
}
export function applyStoryEffect(score,effect,difficulty){for(const [key,value]of Object.entries(effect||{})){if(!(key in score))continue;const scale=difficulty==='difficile'&&value<0?1.5:difficulty==='facile'&&value>0?1.25:1;score[key]+=Math.sign(value)*Math.ceil(Math.abs(value)*scale);}}
const beat=(speaker,text,profileId=null,mood='neutral',space='table',extra={})=>({speaker,text,profileId,mood,space,...extra});
function endStory(room){
 const m=room.match;m.done=true;m.deadline=null;
 const threshold=({facile:2,normal:4,difficile:6})[room.difficulty]||4;
 if(m.mode==='doubleDate'){
  m.individual=m.scores.map(s=>s.connection>=threshold&&s.respect>=0&&s.trust>=0?'interested':s.connection>=1&&s.trust>=-1?'hesitant':'apart');
  m.successful=m.individual.every(x=>x==='interested');m.ending=m.pair.profiles.map((id,r)=>{const p=getProfile(m.mode,id);return `${p.name} et ${name(room,r)} : ${m.individual[r]==='interested'?'elle propose de vous revoir':m.individual[r]==='hesitant'?'elle a passé un bon moment, mais préfère prendre son temps':'elle préfère en rester à cette soirée'}.`;}).join(' ');
 }else if(m.mode==='coach'){
  m.winner=m.scores[0].connection>=threshold&&m.scores[0].trust>=0?0:null;
  m.ending=m.winner===0?'Elle propose de vous revoir. Vous avez trouvé votre façon de vous parler.':'Elle te remercie pour la soirée, mais ne propose pas de deuxième rendez-vous.';
 }else{
  const value=s=>s.connection+s.trust+s.respect*.5;
  const v=m.scores.map(value);m.winner=Math.max(...v)<threshold||v[0]===v[1]?null:v[0]>v[1]?0:1;
  m.ending=m.winner===null?'Elle a pris le temps de vous découvrir tous les deux, mais préfère rentrer seule.':`Elle propose à ${name(room,m.winner)} de se revoir, cette fois à deux.`;
 }
}
function enqueue(room,beats,advance=true){const m=room.match;m.playback={id:crypto.randomUUID(),index:0,ack:[false,m.mode==='coach'],beats,advance};m.deadline=null;}
function resolve(room){
 const m=room.match,roles=m.mode==='coach'?[0]:[0,1],beats=[];
 for(const r of roles){
  const selection=m.storyPicks?.[r];if(!selection)continue;
  const s=storyScene(room,r),o=s.options.find(o=>o.id===selection),p=profileFor(m,r),speaker=s.speaker?getProfile('doubleDate',s.speaker):p;
  applyStoryEffect(m.scores[r],o.effect,room.difficulty);m.group=(m.group||0)+(o.effect.group||0);
  if(o.cross)applyStoryEffect(m.scores[1-r],{connection:o.cross},room.difficulty);
  if(o.rival)applyStoryEffect(m.scores[1-r],{connection:o.rival},room.difficulty);
  if(o.memory)m.memories.push({round:m.round,role:r,tag:o.memory});
  m.history??=[];m.history.push({round:m.round,role:r,text:o.text,option:o.id});
  const mood=o.reaction||((o.effect.connection||0)>0?'delighted':(o.effect.connection||0)<0?'displeased':'neutral');
  beats.push(beat(name(room,r),o.text,p.id,'neutral',s.space||'table',{player:r}));
  if(o.event==='cheat')beats.push(beat('', 'Tu essaies de rapprocher discrètement une boule du trou.',p.id,'neutral','pool',{animation:'cheat'}));
  beats.push(beat(speaker.name,o.reply,speaker.id,mood,s.space||'table',{scoreRole:r}));
  if(o.event==='marco')beats.push(
   beat('Marco','Hé Livia ! Ça va depuis la dernière fois ?','marco','happy','table'),
   beat('Livia','Ça va ! Je te présente mon rencard. Apparemment, c’est un habitué ici !','dd-livia','happy'),
   beat('Marco','Ah ouais ? Enchanté, moi c’est Marco, le patron. Pourtant, je crois pas t’avoir déjà vu dans le coin !','marco','skeptical'),
   beat('Livia','Attends… tu viens de me mytho depuis tout à l’heure ?','dd-livia','angry'),
   beat('Marco','Je vous laisse discuter. Faites-moi signe pour la suite.','marco','neutral'),
   beat('', 'Marco retourne derrière son comptoir.','dd-livia','disappointed'));
 }
 m.storyPicks={};enqueue(room,beats);
}
export function storyAction(room,role,action,now){
 const m=room.match;
 if(action.type==='ackInvitation'){
  if(m.stage!=='invitation'||action.invitationId!==m.invitation.id||(m.mode==='coach'&&role===1))throw Error('Cette invitation a changé');
  m.invitation.ack[role]=true;if(m.invitation.ack.every(Boolean)){m.stage='prepare-identification';}return true;
 }
 if(action.type==='nextScene'){
  const playback=m.playback;if(!playback||action.reactionId!==`${playback.id}:${playback.index}`||(m.mode==='coach'&&role===1))throw Error('Cette réplique a changé');
  playback.ack[role]=true;if(playback.ack.every(Boolean)){
   playback.index++;playback.ack=[false,m.mode==='coach'];
   if(playback.index===playback.beats.length){m.playback=null;if(playback.advance)m.round++;if(m.round>=storyScenes(m,0).length)endStory(room);else if(m.mode==='coach')m.deadline=now+45000;}
  }return true;
 }
 if(action.type==='answer'){
  if(m.done||m.playback||m.stage!=='conversation'||!m.identified?.every(Boolean)||(m.mode==='coach'&&role===1))throw Error('Le rendez-vous n’est pas prêt');
  const scene=storyScene(room,role);if(!scene?.active||action.round!==m.round+1||action.sceneId!==scene.id)throw Error('La question a changé ou s’adresse à ton ami');
  const option=scene.options.find(o=>o.id===action.option);if(!option)throw Error('Réponse inconnue');
  m.storyPicks??={};if(m.storyPicks[role])throw Error('Réponse déjà envoyée');m.storyPicks[role]=option.id;
  const required=m.mode==='coach'?[0]:m.mode==='doubleDate'&&[3,4].includes(m.round)?[m.round===3?0:1]:m.mode==='versus'&&[2,3].includes(m.round)?[m.round===2?0:1]:[0,1];
  if(required.every(r=>m.storyPicks[r]))resolve(room);return true;
 }
 return false;
}
export function storyTimeout(room){const m=room.match;applyStoryEffect(m.scores[0],{connection:-2},room.difficulty);m.timeoutCount=(m.timeoutCount||0)+1;enqueue(room,[beat(profileFor(m,0).name,'Tu es encore avec moi ? J’ai l’impression de parler toute seule…',m.profileId,'displeased')]);}
export function invitationFor(room,proposed){
 const m=room.match,p=profileFor(m,0),preferred=PREFERRED_VENUES[p.id],actual=VENUES.find(v=>v.id===preferred),correct=proposed===preferred;
 m.venue=actual;
 if(correct)for(const score of m.mode==='doubleDate'?m.scores:[m.scores[0],...(m.mode==='versus'?[m.scores[1]]:[])])applyStoryEffect(score,{connection:1},room.difficulty);
 const speakers=m.mode==='doubleDate'?m.pair.profiles.map(id=>getProfile(m.mode,id)):[p];
 let text;
 if(m.mode==='doubleDate'&&m.setup.pairId==='duo-studio')text=correct?'Oh excellent ! C’est justement notre repaire avec Livia. On vous attend là-bas ! 🎱':proposed==='luxury'?'Le Belvédère ? Ah non, les endroits trop chics comme ça, c’est pas vraiment notre truc 😅 On se retrouve plutôt au billard ?':'Le kebab ? Pour un premier rendez-vous à quatre, on peut trouver un peu plus sympa quand même 😂 Ça vous dit le billard ?';
 else {const replies={
 'dd-naima':['Le kebab, parfait. On peut poser nos vélos devant et s’entendre parler.','Ça vous dit plutôt le Kebab du Destin ? Iris pourra dîner sans surveiller trois services.'],
 'dd-alma':['Le Belvédère, ça me tente. J’essaierai de ne pas retourner toutes les assiettes.','On se retrouve plutôt au Belvédère ? Céleste rêve de manger quelque chose qu’elle n’a pas préparé.'],
 'dd-jade':['Le Belvédère ? Belle idée. Maya va probablement dessiner la vue.','Je vous propose plutôt le Belvédère. Il y a une vieille photo près du comptoir que Maya adore.'],
 'coach-dounia':['Le Kebab du Destin, parfait. J’arrive avec une faim très peu diplomatique.','Tu veux bien qu’on se retrouve plutôt au Kebab du Destin ? J’ai envie de manger simplement, pas de décrypter une carte.'],
 'coach-katell':['Le Belvédère ? La vue me tente déjà. À tout de suite.','On pourrait plutôt essayer le Belvédère ? J’avais envie de voir les lumières de la ville.'],
 'coach-roxane':['Le Belvédère, oui. Une table calme et je suis contente.','Ça te va si on choisit plutôt le Belvédère ? J’ai besoin d’un endroit où je n’aurai pas à tendre l’oreille.'],
 'coach-safia':['Le billard, excellente idée. J’aime les comptoirs qui ont une histoire.','Ça te dit plutôt la Salle de Billard ? Ça me rappelle le café de ma tante.'],
 'vs-gabrielle':['Le kebab, ça me va. On évitera de débattre une heure du couvert à utiliser.','Je vous propose plutôt le Kebab du Destin. On sera plus à l’aise pour discuter.'],
 'vs-mina':['Le billard ? Oui, mais je garde le droit d’être nulle.','On tente plutôt la Salle de Billard ? Une soirée qui peut déborder un peu du repas.'],
 'vs-yasmine':['Le kebab, parfait. Je viens sans tenue de plaidoirie.','On se retrouve plutôt au Kebab du Destin ? Je veux une soirée sans cérémonie.'],
 'vs-emilie':['Le Belvédère, oui. Je connais un coin tranquille pour les sacs et les livres.','Je vous propose plutôt le Belvédère. On pourra prendre notre temps et s’entendre.']};
 const key=m.mode==='doubleDate'?CONTENT.doubleDate.duos.find(d=>d.id===m.setup.pairId).profiles[0]:p.id;text=replies[key][correct?0:1];}
 const speaker=m.mode==='doubleDate'?getProfile(m.mode,m.setup.pairId==='duo-studio'?'dd-solene':CONTENT.doubleDate.duos.find(d=>d.id===m.setup.pairId).profiles[0]):speakers[0];
 const messages=[{speaker:name(room,0),text:`On vous propose ${VENUES.find(v=>v.id===proposed).name}.`},{speaker:speaker.name,text}];
 if(m.mode==='doubleDate'&&m.setup.pairId==='duo-studio')messages.push({speaker:'Livia',text:'Je garde la table près du comptoir. Solène prétend qu’elle ne s’est pas entraînée.'});
 if(!correct)messages.push({speaker:name(room,0),text:`D’accord, on vous rejoint à ${actual.name}.`});
 m.invitation={id:crypto.randomUUID(),messages,ack:[false,m.mode==='coach']};m.stage='invitation';
}
export function introStory(room){
 const m=room.match;if(m.mode!=='doubleDate'||m.setup.pairId!=='duo-studio')return;
 enqueue(room,[beat('Solène','Ah, vous voilà ! Bienvenue dans notre deuxième maison ! Avec Livia, on venait souvent ici après le boulot, quand on travaillait ensemble.','dd-solene','happy'),beat('Livia','On connaît presque tous les habitués maintenant !','dd-livia','happy')],false);
}
export function storyProjection(room,role){
 const m=room.match,p=profileFor(m,role),isCoach=m.mode==='coach'&&role===1;
 if(m.stage==='invitation')return isCoach?{stage:'invitation',roleView:'coach',dossier:publicProfile(p),targetImage:p.media.photos[0],scene:null,lastReveal:[],reaction:null,deadline:null}:{stage:'invitation',invitation:{id:m.invitation.id,messages:m.invitation.messages,ready:m.invitation.ack[role]},scene:null};
 if(m.stage!=='conversation'&&!m.done)return null;
 if(isCoach)return {round:Math.min(m.round+1,storyScenes(m,0).length),total:storyScenes(m,0).length,roleView:'coach',dossier:publicProfile(p),targetImage:p.media.photos[0],scene:null,lastReveal:[],reaction:null,deadline:null,ending:m.done?m.ending:null};
 const s=storyScene(room,role),b=m.playback?.beats[m.playback.index],actorId=b?.profileId||s?.promptSpeaker||s?.speaker||p.id,actor=getProfile(m.mode,actorId),mood=b?.mood||moodFor(m.scores[m.mode==='coach'?0:role]);
 const sprite=actorId==='marco'?`/solo/assets/mp/marco-${mood==='happy'?'amused':mood==='skeptical'?'skeptical':'neutral'}.webp`:SPRITES[actorId]?.[mood]||actor?.media.actor.neutral;
 const reaction=m.playback?{id:`${m.playback.id}:${m.playback.index}`,ready:m.playback.ack[role],both:true}:null;
 const space=b?.space||s?.space||'table';
 return {story:true,round:Math.min(m.round+1,storyScenes(m,role).length),total:storyScenes(m,role).length,identifying:false,identified:true,seats:null,
 actor:{name:actorId==='marco'?'Marco':actor?.name||p.name,photo:actorId==='marco'?sprite:SPRITES[actorId]?.[moodFor(m.scores[b?.scoreRole??role])]||sprite,mood,transient:b&&b.player===undefined&&actorId!=='marco'?{id:`${m.playback.id}:${m.playback.index}`,photo:sprite}:null},space,animation:b?.animation||null,
 backdrop:m.venue?.id==='arcade'?`/solo/assets/mp/billiards-${space==='pool'?'pool':'table'}.webp`:m.venue.image,
 scene:!reaction&&s?{id:s.id,prompt:s.prompt,transition:s.transition,turn:s.active?'simultaneous':`player${1-role}`,options:s.active?s.options.map(({id,text})=>({id,text})):[]}:null,
 selected:!!m.storyPicks?.[role],reaction,lastReveal:b?[{role:b.player??null,speaker:b.speaker,reply:b.text,beat:true}]:[],ending:m.done?m.ending:null,winner:m.done?m.winner??null:null,
 ...(m.mode==='doubleDate'?{profiles:[{...publicProfile(p),photo:p.media.photos[0],mine:true}],personal:true}:m.mode==='versus'?{profile:{...publicProfile(p),photo:p.media.photos[0]}}:{roleView:'single'}),
 };
}
