# Profils et rendez-vous multijoueurs

Le catalogue contient exactement quatre profils par mode. Le mode solo garde ses profils et ses assets existants.

| Mode | Profils |
| --- | --- |
| Foxy Duo | Livia, Solène, Naïma, Iris |
| Foxy Versus | Gabrielle, Mina, Yasmine, Émilie |
| Blind Foxy | Dounia, Katell, Roxane, Safia |

Chaque identité conserve son portrait principal d’origine. Trois nouvelles photographies présentent la même personne dans d’autres tenues et situations ; une sortie photographiée n’est pas automatiquement un intérêt déclaré. Trois questions personnelles complètent sa bio et ses intérêts, sans donner une fiche de solutions.

Chaque profil a son propre pack d’identification : la vraie candidate, deux femmes ressemblantes avec des différences visibles, et un personnage absurde avec une moustache, une perruque et un diadème. Les autres profils jouables ne sont pas utilisés comme faux sosies. L’ordre et les clés des places sont aléatoires. Les photos de référence et de salle sont différentes ; il faut reconnaître la personne, pas rechercher le même fichier.

## Assets

`server/media-manifest.mjs` contient la correspondance privée des douze identités :

- `photos` : photo principale existante puis trois scènes de vie ;
- `actor` : photographies neutre, souriante et gênée dans le même décor et la même tenue ;
- `lookalikes` : deux sosies crédibles et le leurre absurde.

Les 108 nouvelles images sont dans `public/solo/assets/mp/people/`, avec des noms opaques qui n’indiquent pas la réponse. Le décor de table est `public/solo/assets/mp/table-foreground.webp`. Les 12 planches de génération ont été contrôlées visuellement contre les portraits d’origine avant extraction et compression WebP. La vérification technique complète est :

```bash
node scripts/audit-profile-assets.mjs
pnpm run validate:narrative
pnpm run test:narrative
```

Ne pas exporter ce manifeste dans une ressource publique ou dans le JavaScript client. Une nouvelle identité doit recevoir ses propres photos et expressions ; ne jamais emprunter silencieusement celles d’une autre candidate. Le validateur liste les fichiers manquants avec leur chemin.

## Blind Foxy

Le Coach consulte uniquement le profil smartphone, avant et pendant le rendez-vous. Les photos s’affichent entièrement et les flèches changent de photo localement. La galerie et sa position survivent aux rafraîchissements de l’état. Le serveur ne lui envoie aucune scène, option, réaction ou solution cachée. Il doit écouter son partenaire sur Discord ou dans le chat facultatif.

Le célibataire voit quatre candidates sans le profil privé. Après son choix, il voit le rendez-vous dans le lieu, les expressions de sa partenaire et ses choix de dialogue. Une mauvaise reconnaissance reste rattrapable mais coûte du respect. Le chrono de 45 secondes est côté serveur ; il s’arrête pendant la lecture d’une réaction. Seul le célibataire poursuit le dialogue. Le résultat et les votes de revanche restent communs.

Les cinq scènes de chaque route reprennent une histoire, la développent et reviennent sur un détail. Le contexte prime sur un mot-clé de profil : Dounia peut aimer les desserts tout en venant de préciser qu’elle n’a plus faim. Les autres informations anecdotiques peuvent ne jamais servir.

## Foxy Duo et Versus

Duo propose quatre profils et laisse les deux joueurs choisir indépendamment des partenaires différentes. Les étapes de match, lieu et identification restent coordonnées. Chacun reçoit ensuite ses propres questions et réactions ; les moments de la table relient les deux récits. Une maladresse initiale peut revenir en fin de conversation et permettre une clarification. L’équipe doit réussir les deux rencontres pour gagner.

Dans Duo et Versus, la réaction reste en grand tant que les deux lecteurs n’ont pas demandé la suite. Les choix Versus simultanés restent privés avant résolution. Les actions incluent une scène ou un identifiant de réaction afin qu’un clic retardé ne saute pas une étape.

Les anciens scénarios et embranchements restent disponibles aux salons déjà engagés. Créer un nouveau salon pour utiliser les nouveaux parcours. Aucune migration ni suppression de données n’est nécessaire.
