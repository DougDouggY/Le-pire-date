import { SPRITES } from './sprite-manifest.mjs';
export { SPRITES };

// Presentation stays server-authoritative: no score, threshold or preferred venue
// is sent to the single player or used to change another player's projection.
export function moodFor(score){
 const value=score.connection+score.trust*.5+score.respect*.5;
 if(value<=-6)return 'angry';
 if(value<=-3)return 'disappointed';
 if(value<0)return 'displeased';
 if(value>=7)return 'delighted';
 if(value>=3)return 'happy';
 return 'neutral';
}
const arrivals={
 'coach-dounia':{
  kebab:'« Ça sent le pain chaud. Et au moins, ici, personne ne nous demandera de parler moins fort parce qu’une fourchette est tombée. »',
  luxury:'« Oh… c’est très cérémonieux. Je pensais qu’on pourrait manger un truc simple, sans devoir répéter le nom des couverts avant. »',
  arcade:'« On pourra trouver un coin pour parler ? Après ma journée, j’espérais entendre autre chose que des gens essayer de gagner. »'},
 'coach-katell':{
  luxury:'« La vue est belle. J’ai presque envie de sortir ma carte, mais promis, je laisse les reliefs tranquilles cinq minutes. »',
  kebab:'« Je m’étais imaginé une belle vue pour discuter, pas celle du distributeur de serviettes. Bon… on est là. »',
  arcade:'« J’avais imaginé un endroit où regarder au loin et s’entendre parler. Ici, même la borne me coupe la parole. »'},
 'coach-roxane':{
  luxury:'« Merci d’avoir pensé à un endroit où on s’entend. Après une journée au casque, c’est un vrai luxe. »',
  kebab:'« Entre la hotte et la télé, je vais encore passer la soirée à essayer d’isoler une voix… j’aurais préféré un endroit calme. »',
  arcade:'« Des enceintes dans tous les coins… j’espérais justement reposer mes oreilles ce soir. »'},
 'coach-safia':{
  arcade:'« Oh, les vieilles bornes ! Il y en avait une dans le café de ma tante. Je ne garantis pas que mes souvenirs des scores soient fiables. »',
  luxury:'« C’est joli, mais un peu figé. J’imaginais un endroit avec des objets qui ont déjà vécu, pas des verres qu’on a peur de toucher. »',
  kebab:'« On est là, alors on reste. J’avoue que j’avais envie d’un endroit un peu plus singulier pour une première rencontre. »'}
};
export function arrivalFor(profile,venue,wrongPerson){
 const lines=[];
 if(wrongPerson)lines.push('« C’est moi, juste ici. Tu viens de raconter notre début de soirée à quelqu’un qui attend sa commande… »');
 if(venue&&arrivals[profile.id])lines.push(arrivals[profile.id][venue]);
 return lines.filter(Boolean).join(' ');
}
