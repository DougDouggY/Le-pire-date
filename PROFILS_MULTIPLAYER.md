# Profils et rendez-vous multijoueurs

Le catalogue contient huit profils dans Foxy Duo, organisés en quatre binômes fixes, et quatre profils dans chacun des deux autres modes. Le mode solo garde ses profils et ses assets existants.

| Mode | Profils |
| --- | --- |
| Foxy Duo | Livia & Solène ; Naïma & Iris ; Alma & Céleste ; Jade & Maya |
| Foxy Versus | Gabrielle, Mina, Yasmine, Émilie |
| Blind Foxy | Dounia, Katell, Roxane, Safia |

Chaque identité conserve son portrait principal d’origine. Trois nouvelles photographies présentent la même personne dans d’autres tenues et situations ; une sortie photographiée n’est pas automatiquement un intérêt déclaré. Trois questions personnelles complètent sa bio et ses intérêts, sans donner une fiche de solutions.

Chaque profil a son propre pack d’identification : la vraie candidate, deux femmes ressemblantes avec des différences visibles, et un personnage absurde avec une moustache, une perruque et un diadème. Les autres profils jouables ne sont pas utilisés comme faux sosies. L’ordre et les clés des places sont aléatoires. Les photos de référence et de salle sont différentes ; il faut reconnaître la personne, pas rechercher le même fichier.

## Assets

`server/media-manifest.mjs` contient la correspondance privée des seize identités :

- `photos` : photo principale existante puis trois scènes de vie ;
- `actor` : anciennes photographies neutre, souriante et gênée ; la neutre reste la référence du pack d’identification ;
- `lookalikes` : deux sosies crédibles et le leurre absurde.

Les 144 images ajoutées pour les galeries et packs d’identification sont dans `public/solo/assets/mp/people/`, avec des noms opaques qui n’indiquent pas la réponse. Le décor de table `public/solo/assets/mp/table-foreground.webp` est conservé ; la nouvelle scène utilise la table du lieu pour laisser le buste entièrement visible. Les planches de génération ont été contrôlées visuellement contre les portraits d’origine avant extraction et compression WebP. La vérification technique complète est :

```bash
node scripts/audit-profile-assets.mjs
pnpm run validate:narrative
pnpm run test:narrative
```

Ne pas exporter ce manifeste dans une ressource publique ou dans le JavaScript client. Une nouvelle identité doit recevoir ses propres photos et expressions ; ne jamais emprunter silencieusement celles d’une autre candidate. Le validateur liste les fichiers manquants avec leur chemin.

## Blind Foxy

Le Coach consulte uniquement le profil smartphone, avant et pendant le rendez-vous. Les photos s’affichent entièrement et les flèches changent de photo localement. La galerie et sa position survivent aux rafraîchissements de l’état. Le serveur ne lui envoie aucune scène, option, réaction ou solution cachée. Il doit écouter son partenaire sur Discord ou dans le chat facultatif.

Le célibataire voit quatre candidates sans le profil privé. Après son choix, il voit le rendez-vous dans le lieu, les expressions de sa partenaire et ses choix de dialogue. Une mauvaise reconnaissance reste rattrapable mais coûte du respect. Le chrono de 45 secondes est côté serveur ; il s’arrête pendant la lecture d’une réaction. Seul le célibataire poursuit le dialogue. Le résultat et les votes de revanche restent communs.

Les scènes de chaque route reprennent une histoire, la développent et reviennent sur un détail. Le contexte prime sur un mot-clé de profil : Dounia peut aimer les desserts tout en venant de préciser qu’elle n’a plus faim. Les autres informations anecdotiques peuvent ne jamais servir.

## Foxy Duo et Versus

Duo propose quatre binômes fixes (huit profils) : le premier choix propose l’autre membre du duo au second joueur, qui doit accepter. Un nouveau binôme exige l’accord des deux. Les étapes de match, lieu et identification restent coordonnées. Chacun reçoit ensuite ses propres questions et réactions ; les moments de la table relient les deux récits. Une maladresse initiale peut revenir en fin de conversation et permettre une clarification. L’équipe doit réussir les deux rencontres pour gagner.

Dans Duo et Versus, la réaction reste en grand tant que les deux lecteurs n’ont pas demandé la suite. Les choix Versus simultanés restent privés avant résolution. Les actions incluent une scène ou un identifiant de réaction afin qu’un clic retardé ne saute pas une étape.

Les anciens scénarios et embranchements restent disponibles aux salons déjà engagés. Créer un nouveau salon pour utiliser les nouveaux parcours. Aucune migration ni suppression de données n’est nécessaire.

## Mise en scène Foxy et humeur

Les seize personnages multijoueurs possèdent chacun six sprites WebP transparents
(neutre, sourire, très heureuse, contrariée, déçue, en colère), référencés seulement
par `server/sprite-manifest.mjs`. Les photos du profil et des sosies restent intactes.
Le lieu remplit l’arrière-plan ; le personnage est détouré devant le décor, et les
questions/choix sont placés sous la scène sur ordinateur et téléphone.

Le serveur déduit l’humeur du cumul des conséquences. Après une réponse, le client
montre une réaction immédiate pendant deux secondes, puis revient à l’humeur
courante. Une actualisation de synchronisation ne relance pas les deux secondes.
Les scores et pénalités restent internes, y compris pour le temps écoulé et les
sosies ; le jeu les exprime par des répliques et les expressions du personnage.

Dans les nouvelles parties Blind Foxy, le célibataire choisit le lieu avant
l’identification. Le Coach lit les préférences discrètes de la bio et conseille à
la voix ; il ne reçoit ni classement de lieux ni écran de choix. Le serveur garde
le lieu choisi même s’il est inadapté, applique sa conséquence une seule fois et
compose une remarque d’arrivée propre à la personne et au lieu. Une confusion
avec un sosie produit aussi une réplique, avant la première question. Les salons
anciens déjà commencés continuent leur parcours sans être réinitialisés.


## Conversations reliées et lecture sans défilement

Les nouveaux salons ont six étapes en Duo et Blind Foxy, cinq en Versus. La première
est une commande de boissons, écrite pour chaque personnage et adaptée au lieu.
`server/conversation.mjs` ajoute ensuite une transition spécifique devant chaque
scène d’origine. Les options, effets et identifiants des scènes existantes sont
conservés, ainsi que leurs embranchements ; certaines formulations qui supposaient
un choix jamais effectué ont été corrigées. Le champ `conversation` du salon
réserve ce parcours aux nouvelles parties, sans décaler les anciens salons.

Le texte des questions et réponses est plus compact. Le personnage occupe la
hauteur restante après mesure du panneau de décision, pour garder tous les choix
visibles ensemble. La scène ne masque ni ne tronque de réponse. Les tests couvrent
les textes des seize profils, les branches et les remarques d’arrivée, sur écran
1280 × 720 et téléphones 390 × 844 et 360 × 640, en plus des parties à deux clients.


## Binômes organisés

`server/organized-duos.mjs` définit les quatre liens et les événements de table :
Livia/Solène (anciennes collègues devenues amies), Naïma/Iris (amies du quartier),
Alma/Céleste (sœurs fausses jumelles de 28 ans), Jade/Maya (potes de longue date).
Chaque identité apparaît une seule fois. Les nouveaux profils ont chacun quatre
photos, trois faux sosies et six sprites transparents, sans réutiliser une autre
identité. Leur média est mappé dans `server/extra-duo-media.mjs` ; les routes et
transitions sont dans `extra-duo-routes.mjs` et `extra-duo-conversation.mjs`.

Le premier joueur à liker fixe le binôme, quel que soit son rôle et laquelle il
choisit. Le serveur vérifie que le second choisit l’autre membre ; les choix
concurrents incompatibles sont rejetés. Les cartes initiales sont au nombre de
quatre et permettent de lire les deux profils. Une fois un binôme proposé, une
seule partenaire reste proposée à l’autre joueur, avec une explication.

`duoChange` exige deux votes avant l’identification, y compris depuis le choix du
lieu. Une demande isolée peut être annulée et bloque les confirmations. L’accord
mutuel conserve les villes, remet à zéro matchs et validations, et incrémente
la révision de sélection. Les clients envoient cette révision pour rejeter les
likes devenus obsolètes après une remise à zéro. Les nouvelles parties portent
`paired: true` ; les salons antérieurs continuent sans forcer un nouveau choix.
