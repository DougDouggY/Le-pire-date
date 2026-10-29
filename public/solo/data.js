window.DD_DATA = {
  venues: [
    {id:'luxury',name:'Le Belvédère',address:'au dernier étage, vue sur la ville',image:'./assets/venue-rooftop.webp?v=30',tag:'grand luxe · vue panoramique'},
    {id:'kebab',name:'Le Kebab du Destin',address:'à deux rues du centre',image:'./assets/kebab-night.webp?v=30',tag:'quartier · sauce blanche'},
    {id:'arcade',name:'La Salle de Billard',address:'près du comptoir et des tapis verts',image:'./assets/mp/billiards-table.webp',tag:'tapis vert · comptoir · revanche'}
  ],
  achievements: [
    {id:'date-lea',icon:'📸',title:'Le déclic argentique',condition:'Réussir le rendez-vous avec Léa.',phrase:'Une belle rencontre, sans filtre et sans flash dans les yeux.',rule:'profile_win',profile:'lea'},
    {id:'date-camille',icon:'🐕',title:'Oslo valide le profil',condition:'Réussir le rendez-vous avec Camille.',phrase:'Tu as passé l’entretien d’embauche le plus poilu de ta vie.',rule:'profile_win',profile:'camille'},
    {id:'date-nora',icon:'🌱',title:'Botaniquement compatible',condition:'Réussir le rendez-vous avec Nora.',phrase:'La relation a pris racine. Pour la plante, le pronostic reste réservé.',rule:'profile_win',profile:'nora'},
    {id:'date-ines',icon:'🖋️',title:'À fleur de peau',condition:'Réussir le rendez-vous avec Inès.',phrase:'Tu as vu l’encre, entendu les histoires et gagné le droit à un prochain concert.',rule:'profile_win',profile:'ines'},
    {id:'date-zoe',icon:'🦊',title:'Rox',condition:'Réussir le rendez-vous avec Zoé.',phrase:'Rookie, t’as trouvé ta petite Rox. La rouquine n’a pas fait long feu face à ton charme.',rule:'profile_win',profile:'zoe'},
    {id:'date-manon',icon:'📚',title:'Dernier chapitre',condition:'Réussir le rendez-vous avec Manon.',phrase:'Elle a lu la fin en premier. Cette fois, elle veut connaître la suite.',rule:'profile_win',profile:'manon'},
    {id:'zoe-kebab',icon:'🥙',title:'Caviar-samouraï',condition:'Réussir le date de Zoé au Kebab du Destin.',phrase:'Elle a connu les salons d’aéroport… et maintenant la sauce blanche. Quelle trajectoire.',rule:'profile_venue',profile:'zoe',venue:'kebab'},
    {id:'nora-plants',icon:'🪴',title:'Main verte, langue acide',condition:'Critiquer les plantes de Nora sur ses deux questions dédiées et réussir le date.',phrase:'Les plantes ont pris cher. La relation, étonnamment, a survécu.',rule:'nora_plants'},
    {id:'perfect-date',icon:'✨',title:'Sans une fausse note',condition:'Réussir un date sans mauvaise réponse ni erreur de table.',phrase:'Pas un faux pas. Même le serveur n’en revient pas.',rule:'perfect'},
    {id:'nora-trap',icon:'🪤',title:'Confusion consentie',condition:'Choisir le sosie complice de Nora quand tu cherches sa table.',phrase:'Tu t’es trompé de Nora. Et c’était exactement la bonne réponse.',rule:'nora_trap'},
    {id:'arcade-date',icon:'🎱',title:'La belle ?',condition:'Réussir un date à La Salle de Billard.',phrase:'La soirée mérite une revanche.',rule:'venue_win',venue:'arcade'},
    {id:'luxury-date',icon:'🥂',title:'Addition à trois chiffres',condition:'Réussir un date au Belvédère.',phrase:'Les lumières du Belvédère ont fait leur effet. Ton compte en banque s’en souviendra.',rule:'venue_win',venue:'luxury'},
    {id:'phone-pro',icon:'📵',title:'Téléphone en mode galet',condition:'Réussir un date sans consulter Foxy pendant le rendez-vous.',phrase:'Tu as regardé la personne en face. Révolutionnaire.',rule:'no_phone'}
  ],
  profiles: [
    {id:'lea',name:'Léa',age:27,job:'Architecte d’intérieur',height:'1,67 m',city:'Paris',bio:'Je préfère les gens qui sourient aux phrases toutes faites. J’adore les petits restos tranquilles, les objets qui ont une histoire et les photos argentiques.',likes:['Photo argentique','Petits restaurants','Architecture'],dislikes:['Les gens qui parlent trop fort','Les retards sans prévenir'],photos:['./assets/profile-lea-1.jpg?v=portrait-set-28','./assets/profile-lea-2.jpg?v=portrait-set-28'],prompts:[
      '« Bon, première question importante… Tu m’as trouvée comment, sur l’application ? »',
      '« Tu choisis pour commencer ? Moi, je vais prendre un verre d’eau. »',
      '« Le menu est canon… tu me conseillerais quoi ? »',
      'Le serveur vous interrompt : « Je peux vous apporter du pain ? »',
      '« Tu fais quoi dans la vie ? Tu as l’air d’aimer les beaux endroits. »',
      'Ton téléphone vibre. Léa sourit : « Tu peux répondre, hein. »',
      '« Sur mon profil, j’ai mis que j’aime les objets avec une histoire. Ça t’inspire quoi ? »',
      '« On ferait quoi après le dîner, si on avait encore une heure ? »',
      'Le serveur apporte l’addition et demande : « Je vous laisse quelques minutes ? »',
      'Un petit chien passe près de votre table. Léa le regarde avec un sourire.',
      'Le serveur renverse un peu d’eau sur la table. Léa sursaute.',
      'Une amie de Léa lui envoie un vocal de trente secondes. Elle te regarde.',
      '« Tu peux me prendre en photo ? Mais sans filtre, s’il te plaît. »',
      'Un musicien s’installe juste à côté et joue très fort un morceau de jazz.',
      'La soirée se termine. Léa te demande : « Alors, on se reverra ? »'
    ],answers:[
      'Ton sourire sur la photo au café m’a donné envie de te parler.',
      'Un verre d’eau aussi, s’il te plaît.',
      'La tarte fine aux légumes, elle a l’air super bonne.',
      'Oui, merci. Ça accompagnera bien la tarte.',
      'Je crée des intérieurs. J’aime imaginer ce qu’un lieu peut devenir.',
      'Je le laisse, je préfère profiter du moment avec toi.',
      'Tu m’en raconteras une qui compte vraiment pour toi.',
      'Une petite balade au calme, si ça te dit.',
      'On partage comme on le sent, ça te va ?',
      'Il est trop mignon. On peut lui dire bonjour si son maître est d’accord.',
      'C’est pas grave, ça arrive !',
      'On écoute son vocal ensemble si tu veux, ou tu lui réponds après.',
      'Oui, bien sûr. On peut en faire une juste comme tu aimes.',
      'On peut changer de table si le son te gêne.',
      'Oui, avec plaisir. On choisira un endroit tranquille.'
    ],keys:['sourire','eau','tarte','merci','lieux','moment','histoire','balade','partage','chien','pas grave','vocal','photo','changer','revoir'],slots:[1,1,0,2,1,0,2,1,0,2,0,1,2,0,1]},
    {id:'camille',name:'Camille',age:26,job:'Éducatrice canine',height:null,city:'Montreuil',bio:'Si tu aimes marcher sans savoir exactement où tu vas, on va s’entendre. Mon chien Oslo pense que tous les humains sont là pour lui.',likes:['Randonnée','Chiens','Brunch'],dislikes:['Champagne hors de prix','Les gens qui n’aiment pas les chiens'],photos:['./assets/profile-camille-1.jpg?v=portrait-set-28','./assets/profile-camille-2.jpg?v=portrait-set-28'],prompts:[
      '« Tu as liké la photo où Oslo me vole mon bonnet ou celle où il me vole mon sandwich ? »',
      '« Je vais prendre un jus de pomme pétillant. Tu prends quoi ? »',
      '« Au menu, il y a une grande assiette à partager. Ça te tente ? »',
      'Le serveur arrive avec le pain, mais oublie les petites assiettes.',
      '« Tu aimes les animaux ? Je te préviens, Oslo est mon collègue préféré. »',
      'Camille te montre une photo floue de son chien dans une flaque de boue.',
      '« En rando, tu préfères suivre le sentier ou improviser ? »',
      '« On pourrait faire quoi dimanche ? Oslo sera sûrement avec moi. »',
      'Le serveur demande si vous voulez une seule addition ou deux.',
      'Oslo apparaît en appel vidéo sur le téléphone de Camille.',
      'Un verre glisse au bord de la table et manque de tomber.',
      'Un voisin demande à Camille si elle peut garder son chien demain.',
      '« Si Oslo t’apporte une balle, tu fais quoi ? »',
      'Une grosse pluie éclate dehors alors que vous sortez du restaurant.',
      '« Alors, ça te dirait une balade avec Oslo un de ces jours ? »'
    ],answers:[
      'La photo du sandwich : Oslo a l’air d’avoir gagné le duel.',
      'Un jus de pomme pétillant aussi, s’il vous plaît.',
      'Oui, une assiette à partager, c’est plus sympa.',
      'Pas de souci. Vous pourriez en apporter quelques-unes pour partager ?',
      'Oui, j’adore les chiens. Il a l’air d’avoir une sacrée personnalité.',
      'On dirait qu’il vit sa meilleure vie dans cette flaque.',
      'On peut improviser, tant qu’on ne laisse personne derrière.',
      'Une balade avec Oslo, et un café après si on trouve un refuge.',
      'Deux additions, comme vous préférez.',
      'Tu peux lui dire bonjour, il a l’air de te manquer.',
      'Je la rattrape et je préviens le serveur tranquillement.',
      'Je lui demanderais d’abord si ça t’arrange, toi.',
      'Je lui lance, mais doucement, et je vérifie qu’il a le droit de jouer.',
      'On attend un peu ou on partage un parapluie, comme tu veux.',
      'Carrément. Je prends même les chaussures qui ne craignent rien.'
    ],keys:['chien','pomme','partager','aider','chiens','flaque','improviser','balade','additions','bonjour','rattrape','arrange','balle','parapluie','balade'],slots:[0,2,1,0,2,1,0,2,1,0,2,1,0,2,1]},
    {id:'nora',name:'Nora',age:29,job:'Chercheuse en botanique',height:'1,73 m',city:'Paris',bio:'Je collectionne les plantes impossibles à garder en vie et les mauvaises blagues bien assumées. J’aime les quiz, pas les entretiens d’embauche. J’ai une amie qui me ressemble beaucoup : tu pourrais finir par la confondre avec moi.',likes:['Quiz','Plantes','Humour absurde'],dislikes:['Small talk forcé','Les gens qui inventent des réponses'],wrongChoicesByEvent:{0:['J’ai surtout vu la plante, la bio c’était du remplissage.','La plante a l’air plus intéressante que toi.'],6:['Oui, même une plante en plastique ferait mieux que toi.','Tu devrais peut-être arrêter de t’en approcher.']},photos:['./assets/profile-nora-1.jpg?v=portrait-set-28','./assets/profile-nora-2.jpg?v=portrait-set-28'],prompts:[
      '« Tu as aimé ma bio ou tu as juste vu une plante en arrière-plan ? »',
      '« Je vais prendre un tonic citron. Tu choisis quoi ? »',
      '« Question vitale : dessert maintenant ou on fait semblant d’attendre ? »',
      'Le serveur annonce qu’il n’y a plus le plat du jour.',
      '« Tu fais quoi quand tu n’es pas sur Foxy ? »',
      'Nora sort un mini quiz sur son téléphone : « Une question, pas de triche. »',
      '« Je viens de tuer une plante pourtant réputée increvable. Tu me juges ? »',
      '« Pour un deuxième rendez-vous, un quiz ou un musée ? »',
      'Le serveur pose l’addition au milieu de la table et s’éclipse.',
      'Une plante suspendue au-dessus de vous perd une feuille dans ton verre.',
      'Le serveur renverse de l’eau et Nora éclate de rire par réflexe.',
      'Une amie de Nora t’envoie : « Elle est toujours aussi bizarre ? »',
      '« Je te laisse choisir la musique pour le trajet. Pas de chanson honteuse ? »',
      'Le restaurant organise un quiz improvisé à la table voisine.',
      '« On se revoit ? Tu peux répondre avec une blague, j’accepte. »'
    ],answers:[
      'La bio. Une plante impossible à garder en vie, c’est ambitieux.',
      'Un tonic citron aussi, s’il vous plaît.',
      'Maintenant. L’attente donne juste le temps au dessert de refroidir.',
      'Pas grave, il y a sûrement autre chose qui te tente.',
      'Je bricole des petits jeux et j’essaie de les finir.',
      'Vas-y, mais si je gagne je choisis le dessert.',
      'Je te juge uniquement si tu as mis la plante au soleil direct.',
      'Un quiz dans un musée. Comme ça on peut perdre sur deux sujets.',
      'On partage ? Ou on fait un quiz pour décider ?',
      'Je la retire doucement et je te trouve un verre propre.',
      'On dirait que le serveur a voulu participer au quiz.',
      'Je réponds : « Oui, et c’est précisément le charme. »',
      'Une chanson que j’aime vraiment, même si elle est un peu nulle.',
      'On y va ensemble, mais sans prétendre qu’on connaît les réponses.',
      'Oui. Promis, ma prochaine blague sera moins botanique.'
    ],keys:['bio','tonic','dessert','autre','jeux','quiz','plante','musée','partage','verre','plante','charme','chanson','ensemble','blague'],slots:[2,0,1,2,0,1,2,0,1,2,0,1,2,0,1]},
    {id:'ines',name:'Inès',age:25,job:'Tatoueuse',height:null,city:'Bagnolet',bio:'Je dessine, je vais aux concerts et je préfère une réponse honnête à une phrase apprise par cœur. Les gens qui parlent à ma place, c’est non.',likes:['Rock indépendant','Cuisine épicée','Dessin'],dislikes:['Condescendance','Réponses toutes faites'],photos:['./assets/profile-ines-1.jpg?v=portrait-set-28','./assets/profile-ines-2.jpg?v=portrait-set-29'],prompts:[
      '« Qu’est-ce qui t’a fait liker ? Et attention, la réponse “tes yeux” est déjà prise. »',
      '« Je vais prendre une ginger beer. Tu veux quoi ? »',
      '« Tu supportes le piment ou tu fais semblant devant le menu ? »',
      'Le serveur demande à Inès ce qu’elle veut, puis se tourne vers toi pour répondre à sa place.',
      '« Tu sais dessiner ? Pas besoin d’être bon, juste d’essayer. »',
      'Inès te montre un tatouage qui a une histoire importante pour elle.',
      '« Tu préfères un concert minuscule ou une immense salle ? »',
      '« Pour la prochaine fois, on choisit chacun un endroit ? »',
      'Le serveur apporte deux additions alors que vous n’aviez rien demandé.',
      'Un client à côté fait une remarque désagréable sur ses tatouages.',
      'Le verre d’eau se renverse sur le bord de la table.',
      'Une amie d’Inès passe saluer et dit : « Je te la rends dans cinq minutes. »',
      '« Je vais te montrer mon carnet. Tu peux me dire si un dessin te parle ? »',
      'Un groupe commence à chanter très fort derrière vous.',
      '« Tu veux me revoir ou tu vas me sortir une réponse de profil ? »'
    ],answers:[
      'Ta photo de concert. On dirait que tu sais profiter du moment.',
      'Une ginger beer aussi, s’il vous plaît.',
      'Je goûte, mais je ne vais pas prétendre que je suis invincible.',
      'Je laisse Inès répondre elle-même, c’est son choix.',
      'Je peux essayer. Tu me montres comment tu commences ?',
      'Je t’écoute. On voit que ce dessin compte pour toi.',
      'Un petit concert où on peut encore parler entre les morceaux.',
      'Oui. Je choisis un endroit, tu choisis le suivant.',
      'On leur demande gentiment de corriger, sans leur parler comme à des incapables.',
      'Je lui dis que sa remarque est déplacée, puis je te laisse décider si on bouge.',
      'Je prends une serviette et je rassure le serveur.',
      'Bien sûr, prenez votre temps. Je suis content de mettre un visage sur ton amie.',
      'Oui, montre-moi celui qui te rend le plus fière.',
      'On peut changer de table, si tu préfères.',
      'Oui. Et là, c’est une vraie réponse.'
    ],keys:['concert','ginger','goûte','choix','essayer','écoute','concert','choisis','corriger','déplacée','serviette','amie','fière','changer','vraie'],slots:[1,2,0,1,2,0,1,2,0,1,2,0,1,2,0]},
    {id:'zoe',name:'Zoé',age:31,job:'Hôtesse de l’air',height:'1,70 m',city:'Paris · souvent ailleurs',bio:'Je collectionne les cartes d’embarquement et les petits déjeuners à des heures improbables. Je suis toujours partante pour découvrir un endroit nouveau.',likes:['Voyages','Cuisine du monde','Se lever tôt'],dislikes:['Annuler à la dernière minute','Dire “on verra” pour tout'],photos:['./assets/profile-zoe-1.jpg?v=portrait-set-30','./assets/profile-zoe-2.jpg?v=portrait-set-28'],prompts:[
      '« Tu as liké ma photo de voyage ou la photo où j’essaie de tenir un parapluie à l’envers ? »',
      '« Je vais prendre une eau pétillante. Tu veux quoi ? »',
      '« Tu choisis le plat : quelque chose qu’on ne mangerait pas tous les jours ? »',
      'Le serveur vous prévient que la cuisine ferme dans dix minutes.',
      '« C’est quoi le dernier endroit qui t’a vraiment surpris ? »',
      'Zoé te raconte une escale où elle a raté son bus et fini dans une fête de village.',
      '« Tu planifies tout ou tu peux partir avec juste un sac ? »',
      '« Un prochain rendez-vous à l’aube, ça te ferait fuir ? »',
      'Le serveur vous demande si vous êtes pressés pour l’addition.',
      'Une annonce de train retentit sur le téléphone de Zoé : son retour est retardé.',
      'Une flaque d’eau apparaît sur la table après un geste maladroit du serveur.',
      'Un couple de touristes vous demande de les prendre en photo.',
      '« Je te montre trois photos d’un voyage. Tu choisis la prochaine destination ? »',
      'La pluie se met à tomber et le dernier métro approche.',
      '« Avant que je reparte en escale : tu veux qu’on bloque une date ? »'
    ],answers:[
      'La photo du parapluie. Tu as l’air de ne pas paniquer quand tout part de travers.',
      'Une eau pétillante aussi, merci.',
      'Le plat que tu as envie de me faire découvrir.',
      'On choisit vite ensemble, je ne veux pas vous mettre la pression.',
      'Un petit village au bord de l’eau où je ne connaissais personne.',
      'Ça ressemble à une super histoire. Tu as dansé avec les habitants ?',
      'Un peu des deux : je prévois le départ, pas chaque minute.',
      'Non, un café à l’aube ça se tente. On verra si je tiens debout.',
      'On est bien, on n’est pas pressés. Merci de demander.',
      'On vérifie les options, puis on s’adapte sans se stresser.',
      'Je dis que ce n’est rien et j’aide à essuyer.',
      'Bien sûr. Vous voulez une photo classique ou un peu originale ?',
      'Celle où tu as rencontré des gens par hasard. C’est ça que je préfère.',
      'On prend un taxi ou on court au métro ? Je te suis.',
      'Oui. On bloque une vraie date, pas un vague “on verra”.'
    ],keys:['parapluie','pétillante','découvrir','ensemble','village','danse','prévois','aube','pressés','options','essuie','photo','rencontré','taxi','date'],slots:[0,1,2,0,1,2,0,1,2,0,1,2,0,1,2]},
    {id:'manon',name:'Manon',age:28,job:'Libraire',height:'1,64 m',city:'Paris',bio:'Je lis la dernière page en premier, je perds aux jeux de société avec mauvaise foi et je connais tous les chats du quartier.',likes:['Romans policiers','Jeux de société','Chats'],dislikes:['Karaoké surprise','Les appels en haut-parleur'],photos:['./assets/profile-manon-1.jpg?v=portrait-set-28','./assets/profile-manon-2.jpg?v=portrait-set-28'],prompts:[
      '« Tu as regardé mes photos ou tu as lu ma bio jusqu’au bout ? »',
      '« Je vais prendre un sirop citron. Tu veux quoi ? »',
      '« Si le dessert est bon, on le partage ou chacun protège le sien ? »',
      'Le serveur vous demande si vous voulez la table près de l’enceinte.',
      '« Tu lis quoi en ce moment ? Tu peux dire “rien”, hein. »',
      'Manon sort un petit jeu de cartes de son sac : « Une manche ? Promis, je triche presque pas. »',
      '« Dans un polar, tu préfères trouver le coupable ou te faire surprendre ? »',
      '« On pourrait faire quoi la prochaine fois sans que ça ressemble à une épreuve sportive ? »',
      'Le serveur demande comment vous préférez séparer l’addition.',
      'Un chat s’installe sur le rebord de la fenêtre et fixe votre table.',
      'Le serveur fait tomber une cuillère juste à côté de Manon.',
      'Une amie lui écrit : « Alors, il parle beaucoup ? » Manon te montre l’écran.',
      '« Je peux te lire le début d’un roman que j’adore ? C’est pas trop bizarre ? »',
      'Le restaurant propose un karaoké surprise pour les anniversaires.',
      '« Tu veux qu’on se revoie ? Je peux même choisir le jeu de société. »'
    ],answers:[
      'J’ai lu ta bio. Le coup des chats du quartier m’a fait sourire.',
      'Un sirop citron aussi, merci.',
      'On partage, comme ça on peut goûter les deux.',
      'La table tranquille, si elle est libre.',
      'Un polar que j’essaie de ne pas lire par la fin cette fois.',
      'Oui. Tu m’expliques les règles, et on accuse le hasard si je perds.',
      'Être surpris, mais avoir le droit de relire les indices après.',
      'Un café librairie. Zéro basket obligatoire.',
      'On partage simplement, comme tu préfères.',
      'On peut le regarder de loin et le laisser tranquille.',
      'Ça va ? Je peux la ramasser, pas de souci.',
      'Je lui réponds : « Assez pour écouter tes histoires. »',
      'Oui, vas-y. J’aime bien quand quelqu’un me partage son livre préféré.',
      'On peut décliner poliment et sauver nos oreilles.',
      'Avec plaisir. Et tu choisis les règles, je choisis le café.'
    ],keys:['bio','citron','partage','tranquille','polar','règles','indices','café','partage','chat','ramasser','écouter','livre','décliner','jeu'],slots:[2,0,1,2,0,1,2,0,1,2,0,1,2,0,1]}
  ]
};
// Dialogues relus : la bio, les goûts, les questions et les réactions doivent parler de la même personne.
const dialoguePass = {
  lea: {
    tagline:'« J’aime les lieux qui ont une âme, les petits restos et les photos sans filtre. »',
    wrongChoicesByEvent:[
      ['J’ai liké parce que tu avais l’air facile à convaincre.','J’ai surtout regardé le décor derrière toi.'],
      ['Un mojito XXL, et commande pareil pour toi.','Je ne sais pas, choisis à ma place.'],
      ['Prends ce que tu veux, moi je ne partage jamais.','Je vais prendre le plat le plus cher, on verra après.'],
      ['Non merci, on n’a pas besoin de pain.','Posez-le là et débrouillez-vous.'],
      ['Je fais un métier incroyable, mais c’est trop long à expliquer.','Je préfère parler de moi, c’est plus intéressant.'],
      ['Attends, je réponds, c’est urgent… enfin je crois.','Je vais juste regarder mes notifications sous la table.'],
      ['Les objets, c’est juste de la déco, non ?','Je vais inventer une histoire, ça fera bien.'],
      ['Un bar blindé avec de la musique à fond.','On ira chez moi, ce sera plus simple.'],
      ['On coupe tout au centime exact, même le pain.','Tu peux régler ? Je te rembourserai un jour.'],
      ['Je l’appelle sans demander à son maître.','Les chiens, ça bave. On peut passer à autre chose ?'],
      ['C’est ta faute, tu as fait bouger la table.','Appelez quelqu’un, c’est une catastrophe.'],
      ['Mets le vocal, on va tous l’écouter.','Je vais répondre à sa place, ça ira plus vite.'],
      ['Je te prends en photo au flash, sans prévenir.','Fais une pose comme sur ton profil.'],
      ['Je vais demander au musicien d’arrêter tout de suite.','On reste, tant pis si on ne s’entend plus.'],
      ['On verra, je te dirai peut-être.','Oui, demain matin chez moi, à 7 heures.']
    ],
    goodReplies:[
      '« C’est vrai, cette photo-là me ressemble plus que les photos trop posées. »','« Bonne idée, on commence doucement. »','« La tarte me tentait aussi. On la partage ? »','« Oui, merci. »','« J’aime bien quand quelqu’un remarque les endroits, pas juste leur prix. »','« Ça me va. Je préfère qu’on profite du moment. »','« J’en ai un qui vient de ma grand-mère, je te raconterai. »','« Une balade, oui. C’est souvent là que les meilleures conversations arrivent. »','« Ça me va. On fait simple et on voit ensemble. »','« Il est adorable… on demande à son maître avant de le saluer ? »','« Merci de le prendre comme ça. Je vais juste éponger. »','« Je lui répondrai après, raconte-moi plutôt ce que tu en penses. »','« Oui, garde-la naturelle, c’est mieux. »','« On peut demander une table plus calme, sans lui gâcher sa soirée. »','« Avec plaisir. La prochaine fois, je te fais découvrir mon petit resto préféré. »'
    ]
  },
  camille: {
    tagline:'« Oslo adore tout le monde. Moi, je vérifie d’abord si tu aimes marcher. »',
    wrongChoicesByEvent:[
      ['J’ai liké ta photo, pas besoin de parler du chien.','Je n’ai pas regardé, j’ai liké tout le monde.'],
      ['Un champagne millésimé, et le plus cher.','Je vais prendre ton jus, ça m’évitera de choisir.'],
      ['Je commande pour nous deux, tu me fais confiance.','Je ne partage pas la nourriture, même en rendez-vous.'],
      ['Laissez, on mangera directement dans le plat.','Vous avez oublié ? C’est pourtant votre travail.'],
      ['Les chiens, c’est sale, mais le tien a l’air tolérable.','Je préfère les chiens quand ils ne sont pas dans la pièce.'],
      ['Quelle horreur, il faudrait lui donner un bain.','Tu devrais mieux surveiller ton chien.'],
      ['Je pars devant, tu suivras si tu veux.','Une randonnée ? Tant qu’on ne marche pas vraiment.'],
      ['On le laisse à la maison, ça sera plus simple.','On va en boîte, Oslo attendra.'],
      ['Tu paies, tu as choisi le resto.','On divise au centime près, je sors la calculette.'],
      ['Je prends ton téléphone pour lui parler sans demander.','Il peut attendre, on est en plein rendez-vous.'],
      ['Je laisse le verre tomber, le serveur nettoiera.','C’est la faute du serveur, je vais lui crier dessus.'],
      ['Bien sûr, dis oui tout de suite, ça ne coûte rien.','Tu devrais garder les chiens des autres, ça t’occupera.'],
      ['Je lui prends la balle et je joue sans demander.','Je lance la balle très loin, ça va le fatiguer.'],
      ['On court sous la pluie, j’ai pas envie d’attendre.','Je rentre, je déteste être mouillé.'],
      ['Oui, si tu viens seule et sans Oslo.','On verra un jour, quand j’aurai le temps.']
    ],
    goodReplies:[
      '« Il a effectivement gagné le duel. Le sandwich n’a jamais eu ses chances. »','« Parfait, j’aime bien les boissons pas trop sucrées. »','« Oui, et je promets de te laisser la dernière frite. »','« Merci, je vais les prendre. »','« Il est adorable, mais je te préviens : il prend beaucoup de place sur le canapé. »','« Il s’est éclaté. Le bain, c’est une autre histoire. »','« J’aime bien improviser, mais on garde un œil sur le chemin. »','« Un café après la balade, ça me va. Oslo choisira sûrement la terrasse. »','« Deux, c’est très bien. Oslo n’a pas encore de compte bancaire. »','« Je lui fais coucou. Il me manque déjà un peu, ce clown. »','« Merci ! On l’a évitée de peu. »','« Je vais lui répondre quand on aura fini de manger. »','« Il te l’apporte toujours comme ça. Tu peux lui lancer si tu veux. »','« On se met à l’abri cinq minutes, puis on décide. »','« Oui, je te montrerai son itinéraire préféré. Il en a trois. »'
    ]
  },
  nora: {
    tagline:'« J’aime les quiz, les plantes coriaces et les blagues qui méritent presque un silence. »',
    wrongChoicesByEvent:[
      ['J’ai juste vu la plante, ta bio avait l’air longue.','La plante est plus intéressante que toi.'],
      ['Un soda géant, apporte ce que tu veux.','Je prends la même chose que toi sans demander.'],
      ['On attend la fin du repas, le dessert sera meilleur.','Je commande les trois desserts, tu finiras bien par en vouloir.'],
      ['C’est inadmissible, je vais faire un scandale.','Alors prenez autre chose au hasard.'],
      ['Je passe mon temps à répondre à des questions comme les tiennes.','Je fais un truc très compliqué, tu ne comprendrais pas.'],
      ['Donne-moi les réponses, sinon ça ne m’intéresse pas.','Je cherche les réponses sur internet en douce.'],
      ['Oui, clairement, tu n’es pas douée avec les plantes.','Je te juge, même les cactus meurent chez toi.'],
      ['Un musée silencieux, sans quiz et sans blague.','On fera ce que je veux, j’ai déjà choisi.'],
      ['Tu paies, tu as choisi le restaurant.','Je compte les centimes, même pour l’eau.'],
      ['Je la laisse dans mon verre, elle va s’y plaire.','La plante est mieux là que chez toi, non ?'],
      ['C’est la plante qui se venge de toi.','Il faut faire attention, c’est dangereux l’eau.'],
      ['Je lui dis que tu es bizarre, elle le sait déjà.','Je lui raconte une blague sur les plantes mortes.'],
      ['Je mets une chanson virale, tout le monde l’adore.','Je choisis un morceau que tu détestes pour rire.'],
      ['Je réponds au hasard, c’est pas si compliqué.','Je triche si l’équipe d’en face a l’air forte.'],
      ['On verra, j’ai peut-être un truc de prévu.','Oui, mais seulement si tu me promets un vrai quiz.']
    ],
    goodReplies:[
      '« C’est la plante qui m’a trahie. Ma bio, elle, était innocente. »','« À la même heure, on pourra comparer nos citrons. »','« Enfin quelqu’un qui comprend l’urgence. »','« Bon, je vais devoir choisir un plat sans son avis scientifique. »','« J’essaie surtout de garder des plantes en vie. Résultats mitigés. »','« Marché conclu. Première question : pourquoi les plantes aiment-elles les blagues ? »','« Je plaide coupable. Le ficus a reçu trop d’amour et pas assez de lumière. »','« Un quiz dans un musée, je signe. Il y aura sûrement des réponses fausses à assumer. »','« Quiz ou pile ou face ? Je peux perdre les deux. »','« Pauvre feuille. Je vais la sauver avant qu’elle ne fasse un plongeon. »','« C’est nerveux, je ris quand je suis prise au dépourvu. »','« Réponds-lui que oui, mais que c’est un compliment. »','« Choisis un morceau que tu aimes. Je promets de ne pas noter ton goût. »','« Vas-y, mais si on gagne, on dira que c’était de la stratégie. »','« Je vais préparer une blague botanique de meilleure qualité d’ici là. »'
    ]
  },
  ines: {
    tagline:'« Dessin, concerts et plats qui piquent. Les phrases toutes faites, je les repère vite. »',
    wrongChoicesByEvent:[
      ['J’ai liké parce que tu as l’air facile à impressionner.','Ta photo était mieux que ta bio.'],
      ['Un soda au hasard, choisis pour moi.','Je prends ton verre, il a l’air mieux.'],
      ['Je dis que je supporte, puis je te laisse tout finir.','Je prends le plat le plus doux, le piment c’est pour les autres.'],
      ['Je réponds à ta place, je sais déjà ce que tu veux.','Je dis au serveur que tu n’as pas besoin de choisir.'],
      ['Non, le dessin c’est pour les gens doués.','Je peux dessiner mieux que toi sans essayer.'],
      ['C’est joli, mais raconte-moi plutôt un truc drôle.','Je touche le tatouage pour voir s’il est en relief.'],
      ['Une grande salle, plus il y a de bruit mieux c’est.','Un concert, mais je passe la soirée sur mon téléphone.'],
      ['Je choisis les deux endroits, ce sera plus simple.','On verra, je préfère ne rien prévoir.'],
      ['Vous avez fait deux additions ? C’est n’importe quoi.','Je prends les deux, on réglera ça plus tard.'],
      ['Je lui demande s’il n’a rien de mieux à dire.','Je ris avec lui pour détendre l’atmosphère.'],
      ['Je m’éloigne, c’est le serveur qui gère.','Je te reproche d’avoir renversé l’eau.'],
      ['Je lui dis de revenir plus tard, on est occupés.','Je raconte à ton amie toute notre conversation.'],
      ['Je te donne une note sur dix, comme à un concours.','C’est du dessin, il n’y a pas besoin d’en parler.'],
      ['On leur demande de se taire, tout de suite.','Je chante plus fort qu’eux pour gagner.'],
      ['On verra, je préfère ne pas m’engager.','Oui, mais il faudra que tu changes de style.']
    ],
    goodReplies:[
      '« C’est vrai, j’étais complètement dans le concert. »','« Bonne idée, ça se boit sans faire semblant d’aimer l’alcool. »','« Au moins, tu ne bluffes pas. On choisit selon ton vrai niveau ? »','« Merci. Je préfère répondre moi-même, même quand je mets trois heures. »','« Commence par un trait. Le reste, on verra après. »','« Je te raconterai l’histoire complète si tu veux. »','« Un endroit où on entend encore les paroles, c’est mon luxe. »','« Parfait. J’aime bien que chacun propose un truc. »','« Merci. On leur explique calmement et ils vont corriger. »','« Merci. Je sais gérer, mais ça fait du bien que tu le voies. »','« Je prends une serviette, le serveur n’a pas besoin de se faire engueuler. »','« Je te la présente après. Elle est curieuse, mais pas méchante. »','« Celui-là me plaît parce qu’il ressemble à une idée que j’ai longtemps gardée. »','« On peut changer de place si le bruit nous empêche de parler. »','« C’est une vraie réponse. Alors oui, j’aimerais bien. »'
    ]
  },
  zoe: {
    tagline:'« Je collectionne les départs tôt, les destinations imprévues et les petits-déjeuners d’escale. »',
    wrongChoicesByEvent:[
      ['J’ai liké parce que tu es souvent absente, ça m’arrange.','Je n’ai pas regardé tes photos, j’ai liké au hasard.'],
      ['Un cocktail hors de prix, et le même pour toi.','Choisis à ma place, je ne sais jamais.'],
      ['Le plat le moins cher, même si tu veux autre chose.','Je choisis le plat pour nous deux.'],
      ['Prenez votre temps, je vais réfléchir une heure.','C’est votre problème, vous n’aviez qu’à prévenir.'],
      ['Le dernier endroit ? Mon canapé, tranquille.','Je n’aime pas trop bouger, je préfère rester chez moi.'],
      ['Tu as raté le bus ? Il fallait mieux t’organiser.','J’espère que la fête n’était pas trop nulle.'],
      ['Je planifie chaque minute, sinon c’est raté.','Je pars sans rien prévoir, même sans adresse.'],
      ['À l’aube ? Jamais, je ne me lève pas pour toi.','On verra le jour même, si je suis réveillé.'],
      ['On est pressés, apporte l’addition maintenant.','Je pars, tu peux payer pour nous deux.'],
      ['Tu n’avais qu’à prendre le train d’avant.','On annule le prochain rendez-vous, c’est trop compliqué.'],
      ['Je fais comme si je n’avais rien vu.','C’est rien, laisse le serveur nettoyer seul.'],
      ['Je prends une photo sans leur demander.','Je leur donne mon téléphone et je leur demande dix prises.'],
      ['Je choisis la destination la plus chère.','Je choisis au hasard sans regarder les photos.'],
      ['On va courir, c’est plus rapide que le métro.','Tu n’as qu’à prendre le dernier métro seule.'],
      ['On verra, je ne bloque jamais rien.','Oui, prends directement un billet pour demain.']
    ],
    goodReplies:[
      '« C’est exactement la tête que j’avais quand le parapluie a décidé de s’envoler. »','« Merci. Je garde la tournée de cocktails pour une autre escale. »','« Parfait, je voulais justement te faire découvrir ça. »','« Merci, on choisit vite et on vous libère. »','« Un petit village où je me suis perdue. J’ai fini par trouver une fête et un gâteau. »','« Oui ! Et je me suis retrouvée dans la danse avant de comprendre les paroles. »','« Je prépare le départ, puis je laisse une place aux surprises. »','« Je t’enverrai l’adresse la veille, comme ça tu peux vraiment décider. »','« Merci. On a le temps de finir tranquillement. »','« On regarde les horaires et on trouve une solution, ça arrive. »','« Merci, une serviette et c’est réglé. »','« Bien sûr. Je vous prends en photo, vous me dites si elle vous plaît. »','« Celle où les gens m’ont invitée à leur table. C’est le meilleur souvenir. »','« On regarde les horaires ensemble. Je préfère éviter la course dans les escaliers. »','« Oui. On choisit la date maintenant, ça nous évitera le “on verra”. »'
    ]
  },
  manon: {
    tagline:'« Libraire, lectrice de polars et mauvaise perdante aux jeux. Les chats du quartier me connaissent. »',
    wrongChoicesByEvent:[
      ['J’ai juste regardé tes photos, ta bio c’était trop long.','J’ai liké par erreur, mais maintenant je suis là.'],
      ['Un truc très sucré, choisis pour moi.','Je prends la même chose que toi sans demander.'],
      ['Chacun son dessert, pas question de partager.','Je mange le tien si tu ne finis pas.'],
      ['Oui, la table près de l’enceinte, j’adore crier.','On s’en fiche, installez-nous où vous voulez.'],
      ['Je ne lis jamais, les livres c’est trop long.','Je lis la fin et je jette le livre.'],
      ['Je gagne toujours, tu peux déjà me donner les cartes.','Je ne joue pas, je n’aime pas perdre.'],
      ['Je veux tout savoir dès le début, sinon aucun intérêt.','Je lis la fin et je raconte le coupable.'],
      ['Une course à pied à 6 heures du matin.','On fera ce que je préfère, tu verras.'],
      ['Tu paies, tu as choisi l’endroit.','Je calcule chaque bouchée, même le pain.'],
      ['Je l’appelle pour qu’il vienne à notre table.','Je le fais fuir pour qu’il ne salisse pas la vitre.'],
      ['C’est ta faute, tu l’as fait tomber.','Je laisse la cuillère par terre, ce n’est rien.'],
      ['Je lui réponds que oui, tu parles beaucoup trop.','Je lui montre tes messages, elle pourra juger.'],
      ['Lis vite, je n’ai pas beaucoup de temps.','Je préfère résumer le livre sur internet.'],
      ['Je prends le micro sans demander à personne.','Je chante faux exprès pour faire rire la salle.'],
      ['Oui, si tu me laisses toujours gagner.','On verra, je lis d’abord la dernière page.']
    ],
    goodReplies:[
      '« J’ai mis ça pour prévenir les gens qui pensent que je parle aux chats. Je leur parle vraiment. »','« Citron, très bon choix. Ça fait un peu goûter de colonie. »','« Marché conclu : on goûte les deux et on ne fait pas de procès. »','« Oui, une table tranquille, ce serait parfait. »','« Je viens de commencer un polar. Je te dirai si j’ai trouvé le coupable avant la page 30. »','« Je t’explique les règles, mais je ne garantis pas ma bonne foi. »','« Exactement. J’aime pouvoir être surprise et ensuite vérifier les indices. »','« Un café-librairie, c’est une activité où personne ne demande de courir. »','« On partage simplement, ça ira très bien. »','« Il a l’air bien installé. On le laisse profiter de sa fenêtre. »','« Merci, je vais la ramasser. Les cuillères ont une soirée compliquée. »','« Dis-lui que je t’écoute surtout, c’est mieux que parler beaucoup. »','« Oui, je te lis le passage que je préfère. »','« Je décline, je tiens à notre audition. »','« Avec plaisir. Je te laisserai gagner une manche, peut-être. »'
    ]
  }
};

const sharedWrongReactions = [
  'Elle hésite, puis répond sans relancer la conversation.',
  'Elle te regarde, un peu déconcertée par ta réponse.',
  'Le serveur attend une réponse. Le moment devient gênant.',
  'Elle reprend la conversation, mais l’ambiance retombe un peu.',
  'Elle sourit poliment : tu n’as pas vraiment répondu à ce qu’elle disait.',
  'Elle attend que tu termines, puis reprend le fil sans enthousiasme.',
  'Elle se ferme un peu : tu viens de minimiser quelque chose qui lui plaît.',
  'Elle propose de changer de sujet. L’idée du prochain rendez-vous attendra.',
  'Vous réglez la situation, mais le petit moment complice est passé.',
  'Elle s’en occupe elle-même et garde un œil sur la situation.',
  'Elle souffle, puis aide à réparer le petit incident.',
  'Elle récupère son téléphone et met fin à l’interruption.',
  'Elle range la photo ou le carnet : elle n’a pas envie de se justifier.',
  'La conversation se perd dans le bruit et elle a l’air moins à l’aise.',
  'Elle comprend que tu hésites et ne sait pas si tu veux vraiment la revoir.'
];
window.DD_DATA.profiles.forEach(p=>{
  const d=dialoguePass[p.id];
  p.tagline=d.tagline;
  p.wrongChoicesByEvent=d.wrongChoicesByEvent;
  p.goodReplies=d.goodReplies;
  p.wrongReplies=sharedWrongReactions;
});
