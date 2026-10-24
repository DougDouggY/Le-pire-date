(()=>{
 const key='lpdate.contacts.v1';let memory=null;
 const emptyStats=()=>({games:0,wins:0,losses:0,cooperativeGames:0,cooperativeWins:0,competitiveGames:0,competitiveWins:0});
 function read(){
  let data;try{data=JSON.parse(localStorage.getItem(key)||'null')||memory;}catch{data=memory;}
  if(!data||data.version!==1||!data.identity?.id||!data.stats||!data.players||!data.dates||!Array.isArray(data.seen))data={version:1,identity:{id:crypto.randomUUID(),name:''},stats:emptyStats(),players:{},dates:{},seen:[]};
  return data;
 }
 function write(data){memory=data;try{localStorage.setItem(key,JSON.stringify(data));}catch{/* Session fallback when storage is unavailable. */}window.dispatchEvent(new Event('lpdate-contacts-changed'));}
 function update(fn){const data=read();const changed=fn(data);if(changed!==false)write(data);return data;}
 const photo=src=>src?.startsWith('./')?'/solo/'+src.slice(2):src;
 function unlock(data,p,mode){
  if(!p?.id)return;
  const current=data.dates[p.id]||{id:p.id,name:p.name,photo:photo(p.photo||p.photos?.[0]),wins:0,modes:[]};
  current.wins++;current.lastSeen=Date.now();if(!current.modes.includes(mode))current.modes.push(mode);
  data.dates[p.id]=current;
 }
 function remember(data,s){
  const peer=s.participants?.[1-s.me];if(!peer)return;
  const previous=data.players[peer.id];
  data.players[peer.id]={...previous,id:peer.id,name:peer.name,publicStats:peer.stats,stats:previous?.stats||emptyStats(),lastSeen:Date.now()};
 }
 function addOutcome(stats,result,role){
  stats.games++;stats[result.outcomes[role]==='win'?'wins':'losses']++;
  const cooperative=result.mode!=='versus';
  stats[cooperative?'cooperativeGames':'competitiveGames']++;
  if(result.outcomes[role]==='win')stats[cooperative?'cooperativeWins':'competitiveWins']++;
 }
 window.LP_CONTACTS={
  data:()=>structuredClone(read()),
  identity(name){return update(data=>{if(typeof name==='string')data.identity.name=name.trim().slice(0,28);}).identity;},
  player(name){const d=read();if(name!==undefined){d.identity.name=name.trim().slice(0,28);write(d);}return {...d.identity,stats:{games:d.stats.games,wins:d.stats.wins,losses:d.stats.losses}};},
  remember(s){if(!s.participants?.[1-s.me])return;update(data=>remember(data,s));},
  result(s){
   if(!s.result?.id)return;
   update(data=>{
    if(data.seen.includes(s.result.id))return false;
    remember(data,s);addOutcome(data.stats,s.result,s.me);
    const peer=s.participants?.[1-s.me];if(peer)addOutcome(data.players[peer.id].stats,s.result,s.me);
    for(const p of s.result.dates||[])unlock(data,p,s.mode);
    data.seen.push(s.result.id);data.seen=data.seen.slice(-2000);
   });
  },
  solo(p,id){update(data=>{if(data.seen.includes(id))return false;unlock(data,p,'solo');data.seen.push(id);data.seen=data.seen.slice(-2000);});},
  importSolo(profiles,achievements){
   let unlocked=[];try{unlocked=JSON.parse(localStorage.getItem('foxy.achievements')||'[]');}catch{/* Keep existing achievements untouched. */}
   update(data=>{let changed=false;for(const a of achievements){if(a.rule!=='profile_win'||!unlocked.includes(a.id)||data.dates[a.profile])continue;const p=profiles.find(x=>x.id===a.profile);if(!p)continue;data.dates[p.id]={id:p.id,name:p.name,photo:photo(p.photos[0]),wins:0,modes:['solo'],legacy:true,lastSeen:Date.now()};changed=true;}return changed;});
  },
 };
 // Persist the generated identity before another app asks for it.
 update(()=>{});
})();
