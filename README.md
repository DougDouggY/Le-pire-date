# LE PIRE DATE

Jeu solo d’origine préservé et première tranche multijoueur en ligne pour deux joueurs.

## Modes

- **Double Date** : deux binômes partagent un scénario de table, s’entraident et peuvent tous deux échouer.
- **Date à 3** : manches simultanées et tours individuels alternent; le deuxième prétendant peut rebondir sur la réponse précédente. Le rendez-vous peut choisir l’un d’eux ou personne.
- **Le Coach** : le joueur 1 rencontre la personne sans profil préalable; le joueur 2 a le dossier d’enquête et doit le guider. Une revanche peut inverser les rôles avec une nouvelle enquête.

Les premiers lots contiennent quatre profils par mode, deux combinaisons compatibles pour Double Date, douze portraits stables et cinq embranchements de rattrapage. Les identifiants et les bibliothèques des trois modes restent séparés du mode solo. Les personnages ont des détails visuels précis, des anecdotes, des sujets sensibles, des souvenirs et des réactions écrites. Les profils sont dans `server/content.mjs`.

## Architecture

- Le jeu solo original est conservé sous `public/solo/`; le menu d’accueil ouvre le multijoueur dans une fenêtre superposée.
- `app/api/multiplayer/route.ts` expose les actions de salon.
- `server/engine.mjs` est l’autorité de partie : rôles, salons, présence, choix simultanés, souvenirs, résultats, reconnexion et inversion des rôles.
- Les salons, jetons hachés, révisions et états sont stockés dans Cloudflare D1. Le code du salon sert à rejoindre une place libre; les actions suivantes exigent le jeton individuel.
- La synchronisation utilise une requête toutes les 5 secondes en activité, puis 10 à 20 secondes au repos. Une requête de présence remplace la lecture environ toutes les 30 secondes sans action ; les actions renouvellent déjà la présence. Les onglets masqués et la fenêtre multijoueur fermée arrêtent les requêtes périodiques. Une absence est détectée après 90 secondes. Les quotas gratuits sont partagés au niveau du compte Cloudflare.
- Le navigateur ne reçoit pas les effets de réponse. Le célibataire ne reçoit jamais le dossier Coach. Les choix Date à 3 restent privés jusqu’à ce que les deux soient envoyés.

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
