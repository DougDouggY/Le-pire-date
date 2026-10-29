# Mettre LE PIRE DATE en ligne sur Cloudflare Free

Préparation vérifiée le 24 octobre 2026. Aucune ressource distante n'a été créée, aucune migration distante appliquée et aucun déploiement effectué pendant cette préparation.

## Architecture retenue et isolation

| Élément | Configuration LE PIRE DATE |
| --- | --- |
| Worker | `le-pire-date` |
| Base D1 | **Nouvelle** base `le-pire-date-db` |
| Binding D1 vu par le moteur | `DB` |
| Binding des fichiers statiques | `ASSETS` |
| Configuration utilisée par toutes les commandes dédiées | `wrangler.le-pire-date.json` |
| Entrée du Worker | `worker/cloudflare.ts` |
| Stockage de test local | `.wrangler/le-pire-date` |
| Première adresse publique | Sous-domaine `workers.dev` propre au Worker |

Le Worker réutilise exactement l'API `app/api/multiplayer/route.ts`, le moteur et les contenus existants. Il ne sert pas React/Vinext sur Cloudflare : le jeu réel est déjà une application statique dans `public/solo/`. Cloudflare sert ces fichiers directement ; `/` redirige vers `/solo/` grâce à `public/_redirects`. Seules les URL `/api/*` invoquent le Worker. Cela évite le rendu serveur et sa consommation CPU à chaque visite.

L'entrée Sites/Vinext `worker/index.ts` et sa configuration de développement restent disponibles. **Ne pas déployer `dist/server/wrangler.json`** pour cette installation indépendante : il contient les noms génériques et l'identifiant D1 fictif du starter.

Les codes, jetons et états des salons sont uniquement dans la nouvelle D1. Un même nom de table ou de binding dans un autre jeu ne partage aucune donnée. Aucun binding vers un autre Worker, aucune route sur un domaine existant, aucun R2, KV, Durable Object ou service externe n'est nécessaire. Ne réutiliser aucun identifiant de base ou nom de Worker de BOUFFE OU CRÈVE.

**L'isolation des ressources ne sépare pas les quotas du compte Cloudflare.** Les deux jeux consomment les mêmes allocations gratuites de ce compte. L'épuisement du quota peut donc affecter les deux, même si leurs données et configurations sont isolées.

## Gratuité et budget de requêtes

Limites relevées dans la documentation officielle :

| Ressource | Workers / D1 Free |
| --- | --- |
| Requêtes invoquant un Worker | 100 000 par jour, au niveau du compte |
| CPU par invocation HTTP | 10 ms ; l'attente réseau/D1 n'est pas du CPU |
| Fichiers statiques servis sans Worker | Requêtes gratuites et illimitées |
| D1 : lignes lues | 5 millions par jour |
| D1 : lignes écrites | 100 000 par jour |
| D1 : stockage | 5 Go cumulés ; 500 Mo par base Free |
| D1 : nombre de bases | 10 par compte Free |

La disponibilité d'un compte Cloudflare gratuit ne prouve pas que son offre **Workers** est Free, ni qu'il lui reste du quota. Vérifier le forfait Workers, la consommation de l'autre jeu et la disponibilité d'un emplacement D1 avant création. Aucun état du compte n'a été inspecté pendant cette préparation.

Le paquet autonome vérifié localement pèse environ 27 Ko compressés, avec 91 fichiers statiques au moment de la préparation. La taille ne pose pas de difficulté identifiée. Le respect des 10 ms CPU devra être confirmé dans les métriques du Worker réel : une simulation locale ne prouve pas cette limite en production.

### Synchronisation préparée

- Avant : lecture toutes les 2,2 s, plus une requête de présence approximativement toutes les 8 à 8,8 s, suivie d'une lecture supplémentaire au même cycle.
- Maintenant : une requête toutes les **5 s** en activité ; **10 s** après 30 s sans changement ou en attendant un partenaire ; **20 s** après deux minutes sans changement ou en fin de partie sans vote actif. Les votes de revanche relancent temporairement le rythme de 5 s, puis le délai augmente de nouveau si personne ne répond.
- Le navigateur envoie un heartbeat au prochain cycle après **30 s** sans action. La réponse contient déjà l'état : aucun GET supplémentaire au même cycle.
- Les actions normales renouvellent la présence avec leur écriture existante. Les heartbeats reçus trop fréquemment sont lus, mais ne réécrivent pas la ligne avant 25 s.
- Les onglets masqués et les fenêtres multijoueur fermées arrêtent la synchronisation. Le retour au premier plan relance immédiatement la présence et la lecture.
- Après une erreur réseau, l'intervalle augmente à 10, 20, 40 puis 60 s ; une lecture réussie rétablit le rythme normal.
- Un joueur est considéré absent après **90 s**, au lieu de 15 s. C'est le compromis choisi pour diminuer les écritures et tolérer les onglets suspendus. Une action de l'autre joueur apparaît habituellement sous 5 s, jusqu'à 20 s après une longue inactivité.

Ordres de grandeur pour **un salon, deux joueurs, une seule fenêtre chacun**, hors création, actions, messages, reprises et tentatives en erreur :

| État continu pendant une heure | Requêtes Worker estimées |
| --- | --- |
| Ancien rythme | Environ 4 100 |
| Nouveau rythme actif maximal normal, 5 s | Environ 1 440 |
| Attente prolongée, 10 s | Environ 720 |
| Inactivité/fin, 20 s | Environ 360 |
| Deux fenêtres fermées/onglets masqués | 0 requête périodique après les appels déjà en vol |

La préparation Foxy Duo du Double Date ajoute dix actions ponctuelles lorsque les deux joueurs sont directement d’accord (ville, like, confirmation du match, vote et confirmation du lieu pour chacun), plus la mise à jour des deux pseudos avant Prêt. Les changements de choix et votes de revanche s’ajoutent également. Blind Foxy affiche un décompte local de 45 secondes sans requête à chaque seconde ; l’expiration est traitée une seule fois par le serveur lors d’un accès authentifié, avec sauvegarde protégée par la révision du salon. Contacts et les fiches statistiques ne font aucune requête dédiée : l’historique est local au navigateur et les profils visibles sont déjà dans l’état du salon.

Le gain en activité est d'environ **65 %**. La présence seule représente au plus environ 240 écritures/heure/salon au nouveau rythme, contre environ 820 à 900 auparavant ; les actions peuvent en éviter certaines. Les mutations de jeu et de chat s'ajoutent. Les opérations SQL, index, nettoyages et éventuelles reprises rendent ces chiffres indicatifs : consulter les métriques `rows_read` et `rows_written` pour les valeurs facturées réelles.

Exemples à 5 s, sans compter les actions : cinq salons pendant deux heures représentent environ **14 400 requêtes**. Un salon actif 24 h représente **34 560** requêtes ; trois salons actifs 24 h dépasseraient déjà 100 000, même sans l'autre jeu. Le budget disponible pour LE PIRE DATE vaut `100000 - consommation de l'autre jeu - marge de sécurité`. Ce forfait convient donc surtout à des parties occasionnelles, pas à une garantie de plusieurs salons actifs en permanence.

Pour un trafic plus important, la prochaine évolution serait un transport poussé par WebSocket avec un Durable Object par salon, à étudier séparément avec ses propres quotas. Un ETag/304 réduit les octets, mais ne supprime ni l'invocation Worker ni la lecture D1 ; il ne résoudrait pas le quota de requêtes. Ne pas lancer de ping de surveillance permanent ni ouvrir plusieurs onglets du même joueur inutilement.

## Migrations et sécurité

Les migrations à appliquer **uniquement à `le-pire-date-db`** sont :

1. `drizzle/0000_lazy_sage.sql` : tables de départ, dont `multiplayer_rooms`.
2. `drizzle/0001_motionless_stryfe.sql` : retrait de la table de messages de départ, déjà abandonnée par le moteur ; le chat est dans `state_json`. Migration d'origine conservée.
3. `drizzle/0002_room-expiry-index.sql` : ajout de l'index `multiplayer_rooms_expires_at_idx`, sans suppression de donnée. Il évite de parcourir tous les salons lors du nettoyage des expirés à la création d'un salon.

Les salons expirent après 12 h ; le nettoyage est déclenché à la création d'un salon, sans Cron. Les lectures d'état utilisent la clé primaire `code`. Le schéma Drizzle et les snapshots correspondent à cette structure. `migrations apply` suit les migrations déjà appliquées et peut être relancé ; ne pas exécuter les anciens fichiers SQL à la main sur une base existante.

Les codes d'invitation utilisent maintenant un générateur cryptographique : huit caractères sur un alphabet de 32 signes, soit 40 bits. Le code permet de prendre une place encore libre, pas de reprendre une place occupée. Chaque joueur reçoit ensuite deux UUID aléatoires comme jeton ; seuls leurs hachages SHA-256 sont stockés en D1. Les GET utilisent `Authorization: Bearer`, pas un jeton dans l'URL. HTTPS est fourni par `workers.dev`.

Le moteur filtre les projections par rôle : le célibataire ne reçoit pas le dossier/photo cible du Coach, le Coach n'a pas les options ni l'autorisation de répondre, et les choix simultanés restent cachés jusqu'à leur résolution. Le contenu serveur n'est pas placé dans `public/`. Les messages sont échappés dans le HTML, limités à 280 caractères et à une liste bornée. Les requêtes SQL restent paramétrées et les mises à jour utilisent la révision pour éviter d'écraser l'action d'un autre joueur.

Les gardes API refusent les codes/jetons mal formés avant D1, les POST provenant d'une autre origine, les JSON invalides et les corps dépassant 4 Ko. Les réponses privées sont `no-store`. Le jeton local doit rester privé : il est conservé dans le stockage du navigateur pour la reconnexion.

**Limite restante : il n'y a pas de limitation globale anti-abus ni de CAPTCHA.** Un code de salon est une invitation, pas un compte utilisateur. Les protections de format et de taille ne bloquent pas un bot qui crée des salons valides ; ces appels consommeraient encore le quota Worker et D1. Commencer par un accès partagé à un petit groupe et surveiller les métriques. Avant une diffusion publique importante, préparer une protection dédiée à la création/jonction (par exemple Turnstile propre à ce jeu). Ne pas réutiliser les clés, bindings ou règles de sécurité de l'autre jeu. Une limitation dans le Worker protège surtout D1 : la requête Worker a déjà été consommée. Aucune protection ne garantit un quota gratuit illimité.

## Étapes à suivre depuis un terminal

### 1. Enregistrer ces changements et préparer le poste

Intégrer la branche de préparation à `main` avant de déployer. Se placer dans **le dépôt LE PIRE DATE**, avec Node >=22.13 et pnpm 11.25.0 :

```sh
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm run validate:narrative
pnpm run test:narrative
pnpm exec tsc --noEmit --incremental false
pnpm run lint
pnpm run cloudflare:check
```

`cloudflare:check` compile et examine le paquet avec `wrangler deploy --dry-run`. Cela **ne déploie rien et ne crée aucune ressource**. La compilation Vinext `pnpm run build` reste disponible pour le workflow d'origine ; elle n'est pas nécessaire pour publier l'entrée autonome.

### 2. Valider localement l'entrée qui sera réellement déployée

```sh
pnpm run cloudflare:migrate:local
pnpm run cloudflare:dev
```

Le serveur de test écoute sur le port 8788. Dans un autre terminal :

```sh
MULTIPLAYER_TEST_URL=http://127.0.0.1:8788 pnpm run test:multiplayer
```

Chromium doit être installé ; définir `CHROMIUM_PATH` si nécessaire. En conteneur CI sans sandbox, préfixer la commande de test par `CI=1`. Les tests créent de vrais salons dans la base **locale**, avec deux sessions indépendantes. Ils ne doivent pas être dirigés vers la production.

### 3. Se connecter au bon compte — actions à faire par toi

```sh
pnpm run cloudflare:login
pnpm run cloudflare:whoami
```

Ces commandes utilisent le même répertoire d'authentification Wrangler que les autres commandes `cloudflare:*`. Vérifier le compte affiché. Si plusieurs comptes sont accessibles, sélectionner explicitement le bon, par exemple dans ce terminal :

```sh
export CLOUDFLARE_ACCOUNT_ID="IDENTIFIANT_DU_COMPTE_CHOISI"
```

Ne pas copier de token/API key dans le dépôt ou dans le chat. L'authentification OAuth par `login` suffit normalement. Dans le tableau de bord, vérifier **Workers & Pages** pour le forfait et les requêtes, puis **Storage & databases > D1** pour les lectures, écritures, stockage et nombre de bases. Aucun changement du forfait ou de l'autre jeu n'est nécessaire pour ces vérifications.

Vérifier aussi que le nom de Worker `le-pire-date` est disponible, ou qu'un Worker de ce nom appartient bien à ce projet. Si ce nom désigne une autre application, s'arrêter : un déploiement réutilise le Worker de même nom, il ne demande pas automatiquement de confirmer son remplacement.

### 4. Créer seulement la nouvelle D1

**Cette commande créera une ressource distante ; elle n'a pas été exécutée ici.**

```sh
pnpm run cloudflare:db:create
```

Elle demande la création de `le-pire-date-db`. Si ce nom existe déjà, s'arrêter et vérifier son origine ; ne pas supprimer une base pour réutiliser le nom. Copier l'UUID retourné dans le seul champ `d1_databases[0].database_id` de `wrangler.le-pire-date.json`, à la place de `00000000-0000-4000-8000-000000000000`.

Si tu relances ensuite le serveur local avec ce nouvel identifiant, rejouer `cloudflare:migrate:local` : le changement d'identifiant peut sélectionner un nouveau stockage D1 local. Cela ne touche pas la base distante.

```sh
pnpm run cloudflare:db:info
```

Vérifier que le nom et l'identifiant correspondent à **la base créée à l'étape précédente**. Ne jamais copier l'identifiant d'une base existante de l'autre jeu. Les scripts refusent une migration distante ou un déploiement tant que l'identifiant fictif est présent, ou si les noms/liaisons attendus ont été remplacés.

### 5. Initialiser la nouvelle D1, puis publier le nouveau Worker

**Ces commandes modifieront uniquement les nouvelles ressources ciblées ; elles n'ont pas été exécutées ici.**

```sh
pnpm run cloudflare:check
pnpm run cloudflare:migrate:remote
pnpm run cloudflare:deploy
```

Lire le récapitulatif des migrations avant de confirmer. `cloudflare:deploy` publie le Worker `le-pire-date` avec ses fichiers statiques et le binding `DB` vers la nouvelle D1. Conserver l'adresse HTTPS exacte affichée par Wrangler, de la forme `https://le-pire-date.<sous-domaine-du-compte>.workers.dev`.

Ne pas lancer `wrangler deploy` depuis le dossier de l'autre jeu, ne pas utiliser son nom via `--name`, ne pas ajouter de route sur son domaine et ne pas remplacer sa configuration. Le parcours ci-dessus utilise toujours `wrangler.le-pire-date.json` et n'a besoin d'aucun accès à ses données.

### 6. Contrôler la version en ligne

Avec l'adresse réellement retournée, vérifier :

```sh
curl -i https://le-pire-date.SOUS_DOMAINE_REEL.workers.dev/api/health
curl -I https://le-pire-date.SOUS_DOMAINE_REEL.workers.dev/
curl -I https://le-pire-date.SOUS_DOMAINE_REEL.workers.dev/solo/
```

Attendus : santé JSON `service: le-pire-date`, redirection de `/` vers `/solo/`, puis page du jeu accessible. La santé ne lit pas D1 et ne suffit pas à valider une partie.

Faire ensuite une courte partie sur **deux appareils différents**, idéalement l'un en Wi-Fi et l'autre sur réseau mobile : création/jonction, identification, chat, réponses simultanées, tours individuels, secrets Coach, fin et revanche/inversion, puis rechargement et reprise. Tester les trois modes. Ne pas exposer les jetons dans des captures ou journaux partagés.

Dans le tableau de bord, vérifier les invocations et CPU du **nouveau** Worker, les erreurs 1102/1027/429 et les métriques de la **nouvelle** D1. Contrôler aussi le total du compte pour réserver du budget à l'autre jeu, sans modifier ses ressources. Ne pas promettre une capacité de salons à partir des seuls tests locaux.

Pour les mises à jour suivantes : `git pull --ff-only`, installation figée, tests, `cloudflare:check`, migrations distantes pending s'il y en a, puis `cloudflare:deploy`. Garder la même D1 ; ne jamais recréer ou vider la base à chaque publication.

## Sources officielles

- [Workers : prix et quota quotidien](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers : limites CPU et compte](https://developers.cloudflare.com/workers/platform/limits/)
- [Fichiers statiques : facturation](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [D1 : tarification, lectures/écritures et index](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 : limites par base et par compte](https://developers.cloudflare.com/d1/platform/limits/)

La documentation a été consultée via les fichiers officiels du dépôt [cloudflare/cloudflare-docs](https://github.com/cloudflare/cloudflare-docs/tree/production/src/content) lorsque l'accès direct au site documentaire était filtré. Les forfaits peuvent évoluer : revérifier ces pages et le tableau de bord avant publication.

### Profils et conversations individuelles

Les nouveaux salons Duo conservent des identifiants de profils et des réponses individuelles dans le JSON du salon ; aucune migration D1 supplémentaire n’est nécessaire. Foxy Duo compte huit profils liés en quatre duos ; Blind et Versus en gardent quatre chacun. Le catalogue possède 256 images de personnages et sosies (dont 96 sprites transparents), plus le premier plan de table conservé ; les nouvelles images restent des Assets statiques et ne passent pas par le Worker API. La galerie utilise des contrôles locaux, sans requête de synchronisation additionnelle.

Chaque question Duo produit deux réponses puis deux confirmations de lecture ; une nouvelle partie de six étapes ajoute douze actions de lecture. Versus attend également les deux lecteurs. Blind Foxy attend uniquement la lecture du joueur en rendez-vous, car le Coach n’accède jamais aux scènes, choix ou réactions. Son chronomètre ne tourne pas pendant la lecture. Les mutations utilisent toujours la même sauvegarde avec révision ; aucun service supplémentaire ou minuteur distant n’est créé. Les rythmes de polling et les quotas du compte restent ceux décrits ci-dessus.

Le mapping des photos et sosies est exclusivement côté serveur (`server/media-manifest.mjs`). Les quatre images d’identification portent des noms opaques ; l’API filtre les champs `target` et `kind`. Le Coach ne reçoit pas ces images. Le célibataire ne reçoit ni les galeries ni les réponses du profil privé. Les profils publics ne contiennent pas les effets, valeurs cachées ou scènes futures.

Blind Foxy ajoute un choix de lieu côté célibataire avant l’identification : une seule mutation, aucune requête périodique supplémentaire. Le lieu choisi et sa conséquence sont stockés dans le JSON du salon existant. Le passage de la réaction courte à l’humeur cumulée utilise un délai local de deux secondes, sans appel API. Aucune migration D1 n’est nécessaire.

La commande d’accueil porte les nouvelles parties à six étapes en Duo/Blind et cinq en Versus. Les transitions et le calcul de hauteur du personnage ne déclenchent aucun appel réseau ; les scores, les effets des choix et la bibliothèque complète des embranchements restent côté serveur. Les salons précédents gardent leurs indices de scène grâce au champ de version `conversation`.

Les duos organisés utilisent le JSON existant du salon (`paired`, sélection du binôme, votes et révision de sélection). Aucune migration D1. Un changement de binôme nécessite deux actions de vote ; le catalogue et la navigation entre les membres ne déclenchent aucune requête supplémentaire. Les nouveaux portraits et sosies restent des Assets statiques.
