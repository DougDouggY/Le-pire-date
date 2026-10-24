export const VENUES = [
 {id:'luxury',name:'Le Belvédère',tag:'Vue panoramique · un peu trop chic pour un premier date',image:'/solo/assets/venue-rooftop.webp'},
 {id:'kebab',name:'Le Kebab du Destin',tag:'Sauce blanche · grandes décisions',image:'/solo/assets/kebab-night.webp'},
 {id:'arcade',name:'La Salle Bonus',tag:'Néons · flippers · revanche',image:'/solo/assets/venue-retro-arcade.webp'},
];

export function cleanName(value,fallback){
 const name=typeof value==='string'?value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu,'').trim().slice(0,28):'';
 return name||fallback;
}

export function participant(input,role){
 const id=typeof input?.id==='string'&&/^[a-f0-9-]{36}$/i.test(input.id)?input.id:crypto.randomUUID();
 const games=Math.min(1000000,Math.max(0,Math.floor(Number(input?.stats?.games)||0)));
 const wins=Math.min(games,Math.max(0,Math.floor(Number(input?.stats?.wins)||0)));
 const losses=Math.min(games-wins,Math.max(0,Math.floor(Number(input?.stats?.losses)||0)));
 return {id,name:cleanName(input?.name,`Joueur ${role+1}`),stats:{games,wins,losses}};
}

// The outcome is authoritative; historical totals remain local to each device.
// This runs inside the same optimistic room save, once per match, with no extra SQL.
export function completeSocialResult(room,dates){
 const m=room.match;
 if(!m?.done||m.result||!room.participants?.every(Boolean))return;
 const outcomes=m.mode==='versus'?[0,1].map(role=>m.winner===role?'win':'loss'):
  [0,1].map(()=>m.mode==='coach'?m.winner===0?'win':'loss':m.successful?'win':'loss');
 m.result={id:m.id||crypto.randomUUID(),mode:m.mode,outcomes,dates};
 for(const [role,p] of room.participants.entries()){
  p.stats.games++;p.stats[outcomes[role]==='win'?'wins':'losses']++;
 }
}

export function resetForRematch(room){
 room.previousProfileId=room.match.mode==='doubleDate'?room.match.kind:room.match.profileId;
 room.phase='lobby';room.ready=[false,false];room.match=null;room.chat=[];room.rematchVotes=[null,null];
 room.modeSuggestions=[null,null];
}
