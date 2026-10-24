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
- Les clients interrogent D1 toutes les 2,2 secondes; un battement de présence est écrit toutes les 8 secondes et une absence est détectée après 15 secondes. Cela évite les connexions permanentes, mais consomme les quotas D1 : la gratuité Cloudflare dépend des limites en vigueur et du volume réel.
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
