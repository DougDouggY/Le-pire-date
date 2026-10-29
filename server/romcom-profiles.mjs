// Public hints suggest a temperament; private routes remain server-only.
export function installRomcomProfiles(content){
 const byId=Object.fromEntries(Object.values(content).flatMap(pool=>pool.profiles.map(p=>[p.id,p])));
 byId['dd-livia'].questions.push({question:'Une opinion qui ne fait pas l’unanimité…',answer:'Un mec incapable de sortir sans sa bière, c’est un clochard à la 8.6 avec un meilleur salaire.'});
 byId['dd-solene'].questions.push({question:'On me reconnaît à…',answer:'Mon esprit de compétition. Même au Uno, je joue ma réputation.'});
 byId['dd-livia'].bio='Je monte des documentaires sonores. Je garde les bruits de pluie sur mon téléphone. Ancienne collègue de Solène, toujours complice de nos soirées après le dernier câble rangé.';
 byId['dd-solene'].bio='Je fais en sorte que les spectacles commencent à l’heure. Dans la vie, mes listes se promènent parfois sans moi. Avec Livia, on a gardé quelques bonnes habitudes des fins de service.';
 const hints={
 'dd-naima':'Mon meilleur itinéraire finit parfois devant une vitrine embuée qui sent le pain chaud.',
 'dd-iris':'Après les nuits de travail, je rêve rarement d’un menu en sept services.',
 'dd-alma':'J’ai un faible pour les tables où la lumière fait aussi partie du dîner.',
 'dd-celeste':'Pour une fois, j’aimerais regarder la ville depuis une belle table et ne pas porter de tablier.',
 'dd-jade':'Je collectionne surtout les endroits où on peut regarder dehors et oublier de regarder l’heure.',
 'dd-maya':'Je dessine souvent la ville vue d’en haut. Les verres font parfois des auréoles sur mes croquis.',
 'vs-gabrielle':'Une sortie peut commencer à un comptoir et finir par une bonne odeur de pain.',
 'vs-mina':'Je retourne aux jeux de palets même quand ma première tentative a été lamentable.',
 'vs-yasmine':'Mes meilleures soirées ne demandent ni tenue spéciale ni note de synthèse.',
 'vs-emilie':'Un beau panorama et un endroit pour poser mon sac peuvent déjà me faire rater l’heure.'};
 for(const [id,hint]of Object.entries(hints))byId[id].bio+=' '+hint;
 byId['coach-safia'].bio=byId['coach-safia'].bio.replace('J’aime les lieux qui ont gardé leurs néons et leurs vieilles machines. Une partie me rappelle plus de choses qu’un décor impeccable.','J’aime les vieux comptoirs, les tapis verts et les objets qui ont déjà vécu quelques soirées.');
 const replacements={
 'vs-yasmine':[1,'Un petit bonheur…','Un dimanche où mon téléphone finit par tomber à plat sans que je m’en aperçoive.'],
 'coach-dounia':[2,'Mon petit défaut…','Je peux commencer à distribuer les rôles dans une blague. Déformation professionnelle.'],
 'coach-roxane':[2,'Mon petit défaut…','Je repère les coupes dans un podcast, mais parfois je perds le fil de l’histoire.'],
 'dd-celeste':[2,'Une petite manie…','Je peux rester dix minutes devant une vitrine de cinéma sans décider du film.'],
 'dd-maya':[2,'Mon petit défaut…','Je garde les premières versions de mes dessins, même celles avec six doigts.']};
 for(const [id,[i,question,answer]]of Object.entries(replacements))byId[id].questions[i]={question,answer};
}
