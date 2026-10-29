# Parcours multijoueurs — version narrative 1

Cette version conserve les 16 identités multijoueurs, leurs images et leurs packs de reconnaissance. Les salles de billard et les trois expressions d’un personnage secondaire sont les seuls nouveaux médias. Les masques de théâtre restent interdits par AGENTS.md.

## État et compatibilité

Les nouvelles parties ont `match.story = 1`. Les parties persistées sans cette propriété gardent leurs identifiants de scène, leurs effets et leurs anciens protocoles de lecture. Aucun changement du schéma D1 ni migration n’est nécessaire. Le nouvel état reste dans `multiplayer_rooms.state_json`, protégé par la révision CAS existante.

- `romcom-content.mjs` : 12 parcours (4 duos, 4 Blind, 4 Versus), six étapes chacun ; textes et effets privés au serveur.
- `romcom-profiles.mjs` : accroches publiques et indices de personnalité.
- `romcom-engine.mjs` : propositions de lieu, invitations, tours croisés, choix privés, conséquences, lecture partagée, souvenirs et résultats individuels.
- `engine.mjs` : intégration à l’authentification et aux écritures existantes.

## Préparation et lieu

Duo conserve ses quatre paires fixes et ses deux confirmations. En Versus, les deux joueurs proposent également une même adresse. En Blind, seul le joueur en rendez-vous propose. Une réponse Foxy conduit au lieu retenu par la candidate. Seule une proposition initiale adaptée donne un bonus ; une redirection n’inflige pas de malus.

L’invitation a un identifiant et une barrière de lecture. Les deux téléphones doivent la lire avant la reconnaissance (un seul dans Blind). Le Coach reste sur son dossier et n’obtient ni messages privés ni choix en cours.

## Conversations

Une réponse en attente n’applique aucun effet et ne projette aucun choix, même au joueur qui l’a envoyée. Lorsque les participants requis ont répondu, les effets sont appliqués dans une seule sauvegarde et une séquence de répliques est créée.

Chaque réplique est identifiée par le couple UUID de lecture / index. L’avance demande la confirmation des deux lecteurs, sauf dans Blind où seul le joueur en rendez-vous lit. Les clics retardés sont refusés. Une reconnexion restitue la même réplique et les confirmations déjà enregistrées.

Les tours croisés sont distincts : un joueur répond, les deux lisent, puis l’autre peut réagir à ce qu’il a réellement entendu. Les prénoms sont remplacés côté serveur et échappés à l’affichage. Les effets croisés ne remplacent pas les choix de l’autre joueur.

Les interventions et actions ne sont créées que sur leur branche. Chaque réplique référence son personnage et son espace. Le décor suit la réplique, et le personnage secondaire quitte explicitement la conversation avant la réunion.

Dans Blind, les 45 secondes concernent uniquement la décision. Le délai est suspendu pendant les réactions ; un dépassement ne peut être appliqué qu’une fois, y compris avec deux requêtes concurrentes.

## Résultats et contacts

Duo conserve une appréciation par rendez-vous. Les contacts romantiques sont attribués séparément ; une réussite peut ainsi débloquer un contact pour un seul joueur. Les statistiques personnelles suivent ces résultats individuels. Versus peut désigner chacun des joueurs ou aucun. Blind conserve la réussite commune du joueur et du Coach. Un résultat et ses statistiques ne sont enregistrés qu’une fois, après lecture finale.

## Requêtes et hébergement

Pas de nouvel appel externe, de ressource Cloudflare ni de table. Les choix, conséquences et répliques utilisent les sauvegardes optimistes existantes. La fréquence de synchronisation reste inchangée : 5 secondes en activité, puis ralentissement, pause lorsque l’application est fermée ou masquée. La lecture ajoute une requête par confirmation de réplique et par lecteur, sans nouvelle boucle de polling. Il faut tenir compte de ces actions supplémentaires dans le quota de requêtes du compte gratuit.

## Vérification

```sh
pnpm run test:narrative
pnpm run validate:narrative
node scripts/audit-profile-assets.mjs
pnpm exec tsc --noEmit --incremental false
pnpm run lint
pnpm run build
pnpm run cloudflare:check
CI=1 MULTIPLAYER_TEST_URL=http://127.0.0.1:8788 pnpm run test:multiplayer
```

Les tests de protocole couvrent tous les parcours et les trois difficultés, les propositions de lieux, les informations privées, les barrières de lecture, les branches conditionnelles, les anciennes parties, la reconnexion et les résultats. Les tests navigateur utilisent deux contextes indépendants, la vraie API et la D1 locale.

Le mode solo conserve ses dialogues, ses choix et ses calculs. Seuls le nom et le visuel de l’ancien troisième lieu changent ; son identifiant technique est conservé pour les sauvegardes et succès déjà obtenus.
