# LE PIRE DATE

Jeu solo d’origine préservé et première tranche multijoueur en ligne pour deux joueurs.

## Modes

- **Double Date** : deux joueurs choisissent chacun leur partenaire, vivent deux conversations distinctes autour de la même table et gagnent ou échouent ensemble.
- **Date à 3** : manches simultanées et tours individuels alternent; le deuxième prétendant peut rebondir sur la réponse précédente. Le rendez-vous peut choisir l’un d’eux ou personne.
- **Le Coach** : le joueur 1 rencontre la personne sans profil préalable; le joueur 2 consulte uniquement son profil Foxy et doit le guider à la voix, sans voir les questions ni les réactions du rendez-vous. Une revanche peut inverser les rôles avec une nouvelle enquête.

## Le téléphone : Contacts et Foxy Duo

Le téléphone propose six applications : **Foxy**, **Succès**, **Contacts**, **Foxy Duo** (Double Date), **Foxy Versus** (Versus) et **Blind Foxy** (Coach). Les outils de test sont regroupés dans un panneau repliable.

- **Contacts** conserve sur cet appareil les partenaires rencontrés, les parties terminées avec chacun, les victoires/défaites, et distingue les victoires en coopération des victoires face à face. Les noms et l'identité locale persistent entre les salons. Les fiches des joueurs sont consultables depuis le salon et la partie.
- Un date solo réussi ajoute sa fiche au carnet ; les dates solo déjà débloqués dans les anciens succès sont aussi récupérés, sans inventer un nombre de réussites passé. En multijoueur, Double Date débloque la partenaire de chaque joueur en cas de victoire d'équipe ; Date à 3 débloque le profil uniquement chez le gagnant ; Le Coach débloque la rencontre réussie pour les deux complices.
- Les statistiques et contacts ne sont pas des comptes synchronisés : changer d'appareil ou effacer les données du navigateur remet cet historique à zéro. Les statistiques publiques sont celles annoncées par l'appareil du joueur, pas un classement certifié. Les nouvelles parties terminées sont comptées à partir de cette version ; les anciennes parties multijoueurs ne sont pas reconstituées.
- Chaque application multijoueur ouvre d’abord l’invitation : création avec code privé ou saisie du code reçu, sans demander de pseudo. Après l’arrivée du deuxième joueur, deux renards se rejoignent dans la forêt. Chacun choisit alors son pseudo et clique sur Prêt. L’application choisie par l’hôte détermine le mode ; l’hôte règle la difficulté. Un salon précédent n’est jamais repris automatiquement : un bouton explicite permet de le retrouver.
- En **Foxy Duo**, quatre duos fixes représentent huit profils : deux amies, deux anciennes collègues devenues amies, deux sœurs fausses jumelles et deux potes de longue date. Chaque carte montre le binôme et permet de choisir laquelle rencontrer. Le premier like propose automatiquement l’autre membre à son ami, qui doit accepter ; aucun duo incompatible ne peut démarrer. Les deux peuvent demander et accepter un nouveau binôme, avec remise à zéro des matchs et confirmations. Chacun lit son profil complet, puis les deux confirment leur match et le même lieu. Chacun reconnaît ensuite sa partenaire parmi quatre personnes (la vraie, deux sosies crédibles et un leurre absurde). Questions, choix, réactions et souvenirs restent individuels ; des événements de table communs relient les conversations. Les deux lecteurs confirment le passage à la suite.
- Dans **Blind Foxy**, l’invité est le Coach. Il conserve librement le véritable profil et ses photos, sans recevoir les candidates de la salle, la scène en cours, les choix ou les réactions de son ami. Son profil présente une bio, des intérêts et trois questions personnelles ; il ne révèle pas les valeurs cachées, les effets des réponses ou les scènes futures. Le joueur en rendez-vous voit les quatre candidates puis le restaurant et ses choix. Le délai serveur de 45 secondes est suspendu pendant la lecture d’une réaction ; une expiration coûte 2 points d’affinité. Le joueur poursuit après lecture sans obliger son Coach à cliquer. Le contexte peut contredire un indice du profil : aimer les desserts ne signifie pas en vouloir après avoir dit ne plus avoir faim.
- Dans **Foxy Versus**, les quatre profils, tours individuels et choix simultanés privés sont conservés. Les deux joueurs lisent les grandes réponses et réactions avant de reprendre.

- À la fin, les deux joueurs doivent voter pour le retour au salon. En Coach, une inversion exige deux votes concordants. Un joueur seul ne peut pas réinitialiser la partie de l'autre. La fermeture/réouverture et le rechargement ne comptent pas deux fois un résultat.

Les nouvelles étapes sont enregistrées dans le JSON du salon, avec une écriture par action de préparation ou de vote. Les compteurs du salon sont mis à jour avec la dernière réponse, sans écriture supplémentaire : **aucune nouvelle table D1 ni migration distante n'est nécessaire**. Les contacts sont enregistrés uniquement dans le navigateur ; aucun service de compte ou de messagerie n'est ajouté. La synchronisation adaptative et la pause des onglets masqués restent en place.

La bibliothèque active contient **huit profils en Duo et quatre dans chacun des autres modes**, soit seize identités. Chaque profil possède quatre photos de la même personne, trois petites questions, six sprites de rendez-vous détourés et ses propres deux sosies crédibles plus un leurre absurde. Les routes Duo sont dans `server/personal-content.mjs`, les profils enrichis et les routes de communication Coach dans `server/profile-details.mjs`. Les scénarios de table précédents et leurs embranchements sont conservés pour les anciens salons. Voir [PROFILS_MULTIPLAYER.md](PROFILS_MULTIPLAYER.md) pour le catalogue et les règles de confidentialité.

Dans les nouvelles parties **Blind Foxy**, le Coach conseille le lieu à partir de la bio ; le célibataire choisit l’adresse. Le rendez-vous s’y déroule même si elle est mal adaptée, avec une réplique à l’arrivée, comme en cas de confusion avec un sosie. Les trois modes utilisent six sprites détourés par personnage et un vrai décor, avec les dialogues et choix sous la scène. Après chaque réponse, une réaction de deux secondes revient à l’humeur cumulée. Les pénalités chiffrées restent internes.

## Architecture

- Le jeu solo original est conservé sous `public/solo/`; le menu d’accueil ouvre le multijoueur dans une fenêtre superposée.
- `app/api/multiplayer/route.ts` expose les actions de salon.
- `server/engine.mjs` est l’autorité de partie : rôles, salons, présence, choix simultanés, souvenirs, résultats, reconnexion et inversion des rôles.
- Les salons, jetons hachés, révisions et états sont stockés dans Cloudflare D1. Le code du salon sert à rejoindre une place libre; les actions suivantes exigent le jeton individuel.
- La synchronisation utilise une requête toutes les 5 secondes en activité, puis 10 à 20 secondes au repos. Une requête de présence remplace la lecture environ toutes les 30 secondes sans action ; les actions renouvellent déjà la présence. Les onglets masqués et la fenêtre multijoueur fermée arrêtent les requêtes périodiques. Une absence est détectée après 90 secondes. Les quotas gratuits sont partagés au niveau du compte Cloudflare.
- Le navigateur ne reçoit pas les effets de réponse. Le célibataire ne reçoit jamais le dossier Coach. Le Coach ne reçoit pas la scène ni la réaction du célibataire. Les choix Date à 3 restent privés jusqu’à ce que les deux soient envoyés.

## Développement et validation

Le projet utilise Node 22+, pnpm et Vinext.

```sh
pnpm run validate:narrative
pnpm run test:narrative
pnpm run build
pnpm run lint
```

Le validateur contrôle les champs des profils, les portraits, les scénarios complets, les trois choix et leurs réactions, l’unicité des personnages et l’accessibilité des branches. Les tests couvrent les trois modes, les projections de données privées, la résolution, les issues gagnantes et sans gagnant, la reconnexion et l’inversion des rôles.

Après modification du schéma Drizzle, lancer `pnpm run db:generate`. Les migrations de production sont appliquées par le flux de publication Sites. En local, appliquer les migrations pending avec Wrangler au stockage `.wrangler/state` du preview.

## Démarrer et tester le multijoueur local

Depuis la racine du dépôt, avec Node >=22.13 et pnpm 11.25.0 :

```sh
pnpm install --frozen-lockfile
pnpm run build
```

Pour une **nouvelle base locale uniquement** du workflow Vinext, appliquer les trois migrations dans cet ordre. Ces commandes ne ciblent aucune base distante ; ne pas les rejouer sur une base déjà initialisée. Le workflow Cloudflare indépendant décrit plus bas dispose d'une commande de migration idempotente :

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lazy_sage.sql --yes
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_motionless_stryfe.sql --yes
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_room-expiry-index.sql --yes
pnpm run dev
```

Laisser le serveur tourner, puis lancer dans un autre terminal :

```sh
pnpm run validate:narrative
pnpm run test:narrative
pnpm exec tsc --noEmit --incremental false
pnpm run lint
pnpm run test:multiplayer
```

Les tests navigateur utilisent deux contextes Chromium indépendants et la véritable API avec la D1 locale. Ils couvrent les trois modes, les victoires et échecs, les informations privées, le chat, les réactions, la reconnexion et les revanches, dont l'inversion des rôles Coach. Ils créent des salons de test dans la base locale et ne doivent pas être dirigés vers la production.

Un Chromium installé est nécessaire. `/usr/bin/chromium` est détecté automatiquement ; sinon définir `CHROMIUM_PATH`, ou installer le navigateur Playwright avec `pnpm exec playwright-core install chromium`. `MULTIPLAYER_TEST_URL` permet de choisir l'adresse du serveur local (par défaut `http://127.0.0.1:5173`). Dans un conteneur CI nécessitant Chromium sans sandbox, lancer `CI=1 pnpm run test:multiplayer`.

Le schéma `db/schema.ts` décrit `multiplayer_rooms`. La migration supplémentaire `0002_room-expiry-index.sql` ajoute un index pour le nettoyage des salons expirés, sans suppression de donnée. Pour la configuration indépendante, les migrations suivies automatiquement et les commandes de publication, suivre le [guide Cloudflare](DEPLOIEMENT_CLOUDFLARE.md). Aucun déploiement n'est réalisé par la préparation locale.

Les salons expirent après 12 heures. La reprise d’un ancien salon indisponible ramène automatiquement à Créer/Rejoindre et arrête la synchronisation ; seuls les jetons de ce salon sont retirés du navigateur, jamais les contacts ni les statistiques.

Pour vérifier toutes les images des profils : `node scripts/audit-profile-assets.mjs`. Les images statiques sont servies directement par Assets ; naviguer dans une galerie ne produit aucune action API. Les nouveaux parcours nécessitent un **nouveau salon** ; les parties déjà lancées conservent leur scénario précédent.

Les nouveaux rendez-vous commencent par la commande d’accueil, puis suivent un fil propre au personnage avec une transition entre chaque sujet : six étapes en Duo/Blind Foxy et cinq en Versus. La hauteur du personnage s’adapte au texte pour garder la question et les trois réponses visibles ensemble sur ordinateur et téléphone.
