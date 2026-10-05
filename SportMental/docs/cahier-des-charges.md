# SPORT MENTAL — PROMPT CLAUDE CODE (V3)

## 0. RÔLE ET MODE DE TRAVAIL

Tu es un développeur full-stack senior (Next.js, PWA, UX mobile) **et** tu rédiges le contenu comme un préparateur mental sportif expérimenté. Le contenu est le cœur du produit : une app techniquement parfaite avec des conseils creux est un échec.

Construis une **web app mobile-first installable (PWA)** appelée **Sport Mental** (dépôt GitHub : `sport-mental`). Pas d'app native en V1.

Baseline : *Ton meilleur jeu commence dans ta tête.*

Méthode de travail :
- Avance phase par phase (voir section 14). À la fin de chaque phase : lance `tsc`, `eslint`, `next build`, corrige, puis résume en 5 lignes max ce qui est fait.
- Prends les décisions techniques raisonnables toi-même, sans demander confirmation. Ne pose une question que si un choix est irréversible ou change le produit.
- Si une consigne de ce prompt entre en conflit avec une autre, applique la section 2 (principes de contenu), puis la section 3 (contraintes), puis le reste.

---

## 1. PRODUIT

**Cible** : sportifs loisir et compétition qui veulent mieux gérer erreurs, pression et concentration. **Multi-sports, avec deux sports prioritaires : le padel (principal) et le volley-ball.** Le produit doit pouvoir accueillir d'autres sports plus tard sans refonte (voir section 1 bis).

**Promesse** : ouvrir l'app et obtenir une aide mentale utile en moins de 5 secondes, y compris pendant un match.

**Contrainte réelle du terrain à respecter dans le design** : les temps morts sont courts (padel : environ 20 secondes entre deux points, environ 90 secondes aux changements de côté ; volley : quelques secondes entre deux actions, plus longues pendant les temps morts et entre les sets). Les modes « pendant le match » doivent être utilisables d'une main, en moins de 5 secondes, lisibles en plein soleil, sans scroll, sans texte long.

**Hors périmètre** : réseau social, chat, communauté, paiement, IA payante, emails, SMS.

---

## 1 bis. MULTI-SPORTS (ARCHITECTURE ET CONTENU)

**Choix du sport** : à la première ouverture, le joueur choisit son sport principal (Padel, Volley-ball, Autre sport) ; modifiable dans le profil. Possibilité d'en suivre deux.

**Architecture** : le moteur (routines, modes match, stats, programmes) est indépendant du sport. Le contenu est organisé en couches :
- `core` : contenu valable pour tous les sports (respiration, reset, intention, confiance...).
- `padel` et `volley` : vocabulaire, situations de pression, messages et exercices spécifiques.
- `autre` : n'affiche que `core`, avec un vocabulaire neutre (« action », « point », « match »).
Chaque exercice, message et situation porte un champ `sports: ['all'] | ['padel'] | ['volley']`. Ajouter un sport = ajouter un fichier de contenu, sans toucher au code.

**Répartition minimale du contenu** : au moins 30 exercices au total dont ≥ 15 `core`, ≥ 8 spécifiques padel, ≥ 7 spécifiques volley ; messages « Point suivant » : ≥ 20 `core`, ≥ 8 par sport prioritaire. Programmes de 7 jours : versions `core`, avec missions terrain adaptées au sport choisi.

**Spécificités padel** : points rapides (≈ 20 s), jeu en duo, communication avec le partenaire, rebond sur les vitres, tie-break, adversaires plus forts, tension à la balle de break.

**Spécificités volley-ball** (sport collectif, 6 contre 6, rotations) :
- Séries de points adverses (« run ») : routine pour casser la dynamique, temps mort utilisé comme reset collectif.
- Erreurs de réception, de service ou de smash : reset immédiat, ne pas rester sur l'action précédente, car l'action suivante arrive vite.
- Pression au service (stress du serveur, intention tactique claire plutôt que « ne pas faire faute »).
- Communication d'équipe : appels de balle courts, encouragement après chaque action (même ratée), rôle du capitaine.
- Rôles (passeur, libéro, attaquant, réceptionneur) : intentions et mots-clés adaptés au poste.
- Fins de set serrées et gestion de l'énergie sur un match en plusieurs sets.
- Remplaçant qui entre en jeu : routine d'entrée rapide.

Le mode « Sport Mental » ne doit jamais présenter un exercice padel à un joueur de volley ou l'inverse.

---

## 2. PRINCIPES DE CONTENU (OBLIGATOIRES)

Tout texte, exercice et routine doit respecter ces principes issus de la psychologie du sport. Ne les cite pas à l'utilisateur de façon académique ; applique-les.

1. **Process avant résultat.** On travaille sur ce que le joueur contrôle (respiration, placement, intention, communication, choix tactique), jamais sur le score ou le fait de gagner.
2. **Formuler en positif, jamais en négation.** Les consignes du type « ne pense pas au score » ou « ne stresse pas » ramènent l'attention vers ce qu'on veut éviter. Remplace par une cible d'attention concrète : « Ramène ton regard sur la balle. Choisis ton plan pour ce point. »
3. **Une erreur est une information, pas un verdict.** Séquence en 3 temps : *Reconnaître* (factuel, sans jugement) → *Relâcher* (expiration longue + geste physique de clôture) → *Recentrer* (une intention tactique pour le point suivant).
4. **Routine entre les points en 4 temps** (à utiliser comme structure du mode « Point suivant ») :
   1. *Relâcher* : expiration longue, épaules, regard sur le cordage ou le grip.
   2. *Lire* : un mot factuel sur le point passé (« long », « trop court », « ok »), jamais « nul ».
   3. *Décider* : une seule intention simple pour le prochain point (ex. « première balle dans le corps », « lob profond »).
   4. *Engager* : un mot-clé personnel, regard devant, on joue.
5. **Pression = activation, pas ennemi.** Présenter l'accélération du cœur comme de l'énergie disponible (« ton corps se prépare »), pas comme un problème à supprimer. Viser un niveau d'activation utile, pas le calme absolu.
6. **Respiration réaliste.** Privilégier l'expiration plus longue que l'inspiration (ex. 4 s / 6 s). La pause de 2 s est optionnelle et désactivable (certaines personnes la trouvent inconfortable). Toujours permettre de passer. Ajouter : « Si tu as la tête qui tourne, reprends une respiration normale. »
7. **Visualisation efficace** : 1 à 3 minutes, multi-sensorielle (voir, entendre le bruit de la balle, sentir les appuis), à vitesse réelle, depuis ses propres yeux, et incluant une **erreur suivie d'une récupération réussie** (imagerie de coping). Pas uniquement des scénarios parfaits.
8. **Concentration = attention dirigée.** Distinguer attention large (lire le jeu, placement adverse) et étroite (la balle, le geste). Les exercices apprennent à basculer de l'une à l'autre.
9. **Confiance fondée sur des preuves.** La confiance se construit sur des faits vécus (réussites passées, préparation faite), pas sur des affirmations creuses. Prévoir un « carnet de preuves » où le joueur note ce qui a bien marché.
10. **Autodialogue instructionnel et bienveillant** : « Jambes. Regarde la balle. » plutôt que « Allez, concentre-toi ! » ou « T'es nul ». Proposer de se parler à la 2e personne (« Tu respires, tu joues ton point ») comme option, car la distance aide à rester calme.
11. **Communication avec le partenaire / les coéquipiers** : phrases courtes, positives, rituelles (tape de raquettes au padel, regroupement et « on repart » au volley), jamais de reproche. Un point à convenir *avant* le match : « Que fait-on quand l'un de nous est en difficulté ? »
12. **Humilité** : ne promets aucun résultat (« tu vas gagner »). Dis « ça t'aide à… », « essaie… ».
13. **Pas de dispositif médical.** Aucun diagnostic. Si l'utilisateur exprime une détresse (anxiété envahissante, tristesse persistante, pensées sombres), l'app affiche un message bienveillant l'invitant à en parler à un professionnel de santé, sans jouer au thérapeute.

**Ton** : tutoiement, phrases courtes, calme, sportif, humain, jamais culpabilisant, jamais de « tu dois être fort mentalement ». Pas d'emojis en excès (🎾 en signature, pas partout). Écris en français naturel, comme un coach qui parle à un joueur dans le vestiaire, pas comme un manuel.

**Validation du contenu** : place tout le contenu dans des fichiers de données typés (`/content/*.ts`) faciles à relire et corriger par un coach. Chaque exercice a un champ `principe` (lequel des 13 principes il applique), utilisé uniquement en interne.

---

## 3. CONTRAINTES (V1 À 0 €)

- Code : GitHub Free. Hébergement : Vercel (voir note ci-dessous). Framework : Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Stockage local par défaut** (`localStorage` encapsulé dans un service avec versioning de schéma et gestion d'erreur : quota plein, mode privé Safari). Les fonctions invité doivent marcher à 100 % sans réseau.
- **Supabase Free (Auth + 1 table de matchs) uniquement en phase finale et uniquement pour la synchronisation** de la progression. Si tu juges que la V1 est plus simple sans compte (données locales + export/import JSON), dis-le et propose cette variante : c'est acceptable.
- Aucune API payante, aucune IA, aucun email/SMS, aucun paiement. Analytics : aucun par défaut.
- Dépendances minimales. Pas de librairie de graphiques lourde : graphiques en SVG maison (courbes simples).
- PWA : manifest, icônes (192, 512, maskable), service worker léger pour le mode hors-ligne (utiliser Serwist ou un service worker simple, choisis le plus maintenable avec la version de Next installée, et vérifie sa compatibilité).

**Note à vérifier et à me signaler dans le README** : le plan gratuit de Vercel (Hobby) est destiné à un usage personnel et non commercial. Comme Sport Mental pourra devenir un produit payant, documente l'alternative gratuite (ex. Cloudflare Pages ou Netlify Free) et explique à quel moment il faudra migrer ou passer à un plan payant. Vérifie les conditions actuelles avant de les affirmer.

---

## 4. IDENTITÉ VISUELLE

Dominante verte : vert forêt, émeraude, menthe, vert très clair, blanc, gris clair/foncé. Rendu premium, sportif, apaisant, minimaliste. Pas de couleurs criardes.
- Définis des tokens (CSS variables) pour clair et sombre ; le mode sombre est confortable (pas de noir pur, pas de vert fluo).
- Contraste AA minimum partout. Zones tactiles ≥ 48 px. Focus visible. Labels et `aria-label`. Respect de `prefers-reduced-motion` (l'animation de respiration devient un simple changement de texte/taille sans mouvement).
- **Mode match** (écrans Point suivant / Erreur / Pression) : fond très contrasté, texte énorme, un seul bouton principal, aucun élément parasite.
- Logo SVG : forme sportive neutre (balle ronde stylisée, pas spécifique au padel) avec un motif évoquant la respiration ou une cible. Lisible à 24 px. Nom affiché : Sport Mental.

---

## 5. NAVIGATION

Barre inférieure : **Accueil · Routine · Exercices · Progression · Profil**.
Sur l'accueil et accessibles en un tap depuis n'importe quel écran : trois boutons d'urgence **Point suivant**, **J'ai fait une erreur**, **Je suis sous pression**.

---

## 6. LANDING PAGE

Hero : *Ton meilleur jeu commence dans ta tête.* / *Prépare ton mental, gère la pression et transforme les moments difficiles en opportunités.* Boutons : **Commencer gratuitement** (ouvre l'app sans compte), **Découvrir Sport Mental**.

Section « Pourquoi ? » : *Dans tous les sports, une erreur ne coûte souvent qu'un point. Mais la manière dont tu réagis peut influencer les suivants.* Bénéfices : rester concentré, gérer les erreurs, mieux vivre la pression, renforcer la confiance, communiquer avec son partenaire ou ses coéquipiers, jouer action par action.

Ajoute : comment ça marche en 3 étapes, aperçu des 3 modes match, mention « Sans compte, gratuit, tes données restent sur ton téléphone », avertissement non médical en pied de page. Aucun faux témoignage, aucun faux chiffre.

SEO : title `Sport Mental — Préparation mentale pour padel, volley et sports de match`, meta description `Prépare ton mental, gère la pression et progresse dans ton sport, notamment le padel et le volley, avec Sport Mental.`, Open Graph, favicon, robots.txt, sitemap.

---

## 7. FONCTIONNALITÉS PRINCIPALES

### 7.1 Routine pré-match (3 à 5 min, sautable à chaque étape)
1. **Respiration** : cercle animé, inspire 4 s / (pause 2 s optionnelle) / expire 6 s, 5 à 6 cycles. Textes « Inspire… », « Garde… », « Expire… ».
2. **Où en es-tu ?** Check-in rapide : niveau d'énergie (de « trop bas » à « trop haut » en 5 niveaux) et état du moment. Selon la réponse, la suite s'adapte : énergie haute → respiration plus longue ; énergie basse → activation (se redresser, secouer les bras, 3 respirations toniques).
3. **Objectif mental du jour** (un seul choix) : rester calme, jouer point par point, accepter les erreurs, rester agressif sur les bonnes balles, communiquer avec mon partenaire / mon équipe, prendre du plaisir, rester concentré, autre (texte libre local).
4. **Mot-clé et intention** : propose 5 à 8 intentions orientées process (ex. « Je joue le point présent », « Je contrôle ce que je peux contrôler », « Je fais confiance à mon jeu ») + l'option d'écrire la sienne. Le joueur choisit aussi **un mot-clé** d'une syllabe ou deux (« Souffle », « Ici », « Simple ») qu'il retrouvera pendant le match.
5. **Plan de rebond** : « Si je fais une erreur, je… » → choix d'une réponse (respirer, regarder mon cordage, taper dans ma main, choisir mon prochain coup). Principe « si… alors… » (implementation intention), très efficace.
6. **Visualisation guidée** (1 à 2 min, barre de progression) incluant une erreur et la récupération.
7. **Fin** : *Tu es prêt. 🎾* → bouton **JE SUIS PRÊT** → écran : *Respire. Fais confiance à ton jeu. Joue le point présent.* en rappelant son mot-clé.

### 7.2 Point suivant (mode match)
Un gros bouton **POINT SUIVANT**. Au tap : affiche en 2 à 3 secondes la séquence de la routine en 4 temps de façon ultra-courte (Relâche · Lis · Décide · Engage) **avec le mot-clé du joueur**, puis un message tiré aléatoirement (sans répéter le précédent) dans une bibliothèque de **30 messages minimum**, tous en formulation positive, par exemple :
- « Respire. Le point précédent est terminé. »
- « Un point à la fois. »
- « Choisis ton plan, puis joue-le. »
- « Reset. Respire. Rejoue. »
- « Tu contrôles ton intention, pas le résultat. »
- « Présent. Simple. Engagé. »
- « Regarde la balle. »
- « Jambes actives. »
Finir par **C'EST PARTI 🎾**. Aucun message du style « ne pense pas à… ».

### 7.3 J'ai fait une erreur (mode match)
1. **Respire** : une expiration longue animée (≈ 6 s).
2. **Accepte** : « C'est fait. Ce point est terminé. » (le joueur peut taper pour « fermer » symboliquement le point : geste de clôture).
3. **Recentre** : « Qu'est-ce que tu peux contrôler maintenant ? » → mon placement / ma respiration / ma communication / mon intention / mon prochain coup. Affiche ensuite une micro-consigne liée au choix (ex. placement → « Reviens en position, jambes actives, regarde l'adversaire »).
4. Bouton **POINT SUIVANT**.
Optionnel : marquer le type d'erreur (technique, tactique, décision, énergie) pour alimenter le bilan d'après-match, en un tap, sans jamais forcer.

### 7.4 Je suis sous pression (mode match)
Situations : balle de break, tie-break, fin de set, match serré, balle de match, adversaire plus fort, peur de perdre, peur de décevoir son partenaire ou son équipe. Chaque situation = mini-routine de 4 à 5 écrans courts, dans cet esprit :
1. **Normalise** : « Ton corps se prépare. C'est un signe que ça compte pour toi. »
2. **Corps** : une expiration longue + relâcher les épaules et la mâchoire.
3. **Cible d'attention** : une chose concrète (la balle, le plan tactique, le partenaire ou l'équipe).
4. **Plan** : « Quel est ton plan pour ce point ? » (choix tactique simple).
5. **Engage** : mot-clé + C'EST PARTI.
Écris un contenu **spécifique** pour chaque situation (pas la même routine copiée huit fois). Exemples : *peur de décevoir son partenaire* → rappeler qu'il veut surtout un partenaire engagé, proposer une phrase à lui dire (« On joue ensemble, point par point ») ; *adversaire plus fort* → se concentrer sur ses propres forces et sur un seul objectif tactique ; *balle de match* → rester sur le même processus que d'habitude, pas de coup « spécial ».

### 7.5 Analyse post-match
Notes de 1 à 10 : confiance, concentration, gestion des erreurs, gestion de la pression, communication avec le partenaire / l'équipe, plaisir. Puis :
- Un moment où tu as bien rebondi (texte libre ou choix).
- Principal point fort / ce que tu veux améliorer au prochain match (choix + libre).
- Quel outil de l'app as-tu utilisé ? (routine, point suivant, erreur, pression, aucun).
- Résultat (optionnel : victoire/défaite) mais **jamais au centre** ; le bilan insiste sur le process.
- Comment te sens-tu maintenant ?
- Une recommandation finale, **basée sur des règles locales** : par exemple, si la note la plus basse est « gestion des erreurs », suggérer le programme correspondant ; toujours accompagner d'un point positif.
Sauvegarde locale ; proposer le compte seulement ensuite, sans bloquer.

### 7.6 Progression
Courbes SVG simples par dimension, moyenne, dernière valeur, tendance (calculée uniquement à partir d'au moins 3 matchs). Messages vides honnêtes : *Enregistre ton premier match pour commencer à suivre ta progression.* / *Continue à enregistrer tes matchs pour découvrir tes tendances.* **Jamais de données inventées.** Les tendances sont décrites avec nuance (« en légère hausse »), sans verdict.

### 7.7 Programmes (7 jours, sans IA)
Chaque jour : 5 à 10 minutes, un thème, un exercice à faire hors terrain, **une mission à tester sur le terrain** au prochain entraînement ou match, et une question de bilan en une ligne. Progression locale (jours terminés).
- **Erreurs** : J1 Accepter l'erreur · J2 Respirer · J3 Reset mental · J4 Point suivant · J5 Langage intérieur · J6 Gérer la frustration · J7 Routine complète.
- **Confiance** : J1 Mes preuves de réussite · J2 Mes forces de joueur · J3 Se parler comme à un coéquipier · J4 Posture et énergie · J5 Se rappeler une belle séquence · J6 Prendre un risque tactique calculé · J7 Ma routine de confiance.
- **Pression** : J1 Comprendre l'activation · J2 Respirer sous tension · J3 Cible d'attention · J4 Plan « si… alors… » · J5 Simuler la pression à l'entraînement · J6 Gérer les moments clés (break, tie-break) · J7 Routine complète de moment clé.
- **Concentration** : J1 Ancrage sur la balle · J2 Attention large vs étroite · J3 Mot-clé · J4 Routine entre les points · J5 Gérer les distractions (public, adversaire, bruit) · J6 Retour au présent après une coupure · J7 Match en pleine conscience.

### 7.8 Bibliothèque d'exercices (30 minimum)
Catégories : confiance, concentration, pression, respiration, erreurs, motivation, communication, avant-match, après-match (au moins 3 par catégorie).
Chaque exercice contient : titre, catégorie, durée, difficulté, **quand l'utiliser** (avant / pendant / après / hors terrain), objectif, description courte, instructions en étapes numérotées, **variante express pour le terrain** (≤ 20 s quand c'est pertinent), bouton Commencer (minuteur ou guide pas à pas). Tout est local. Rédige-les de façon concrète, avec des phrases utilisables mot pour mot par le joueur.

### 7.9 Profil
Prénom, sport(s) pratiqué(s), poste (volley), niveau (débutant → compétition), classement éventuel, nombre de matchs, objectif principal, préférences de routine (durée, pause respiration oui/non, vibrations, sons). Mon mot-clé et mes intentions favorites. Rien d'autre. Bouton d'export/import des données (JSON) et de suppression complète.

### 7.10 Tableau de bord
Salutation, carte « Ma routine », « Mon dernier match » (les 6 dimensions), « Ma progression », programme en cours. Uniquement des données réelles ; états vides propres.

---

## 8. COMPTE (OPTIONNEL, PHASE FINALE)

L'app est entièrement utilisable sans compte. Le compte sert uniquement à synchroniser entre appareils. Supabase Auth (inscription, connexion, déconnexion, récupération). Row Level Security activée. Aucun mot de passe stocké côté app. Message : *Crée ton compte gratuitement pour sauvegarder ta progression.* — sans jamais bloquer l'utilisation.

---

## 9. DONNÉES PERSONNELLES (BELGIQUE / UE)

Les notes sur l'état mental peuvent être considérées comme des données sensibles : minimise, garde en local par défaut, explique clairement, demande un consentement explicite avant toute synchronisation, permets l'export et la suppression. Pas de tracking tiers. Pages : Politique de confidentialité, Conditions d'utilisation, Mentions légales (modèles de départ clairement marqués « à faire valider », avec champs entreprise à compléter, sans inventer d'informations légales).

Mention visible (profil, pied de page, première ouverture) :
*Sport Mental est un outil de préparation mentale sportive. Il ne remplace pas l'avis ou l'accompagnement d'un professionnel de santé ou d'un psychologue.*

---

## 10. PERFORMANCE ET ANIMATIONS

Rendu statique autant que possible (SSG), peu de JavaScript client, polices système ou une seule police auto-hébergée, images optimisées, lazy loading. Animations légères (transform/opacity), jamais bloquantes. Objectif Lighthouse ≥ 90.

## 11. SÉCURITÉ

Aucun secret dans le code, variables d'environnement, `.env.example`, `.gitignore`. Validation des entrées. En-têtes de sécurité de base dans la config Next.

## 12. MONÉTISATION (PAS EN V1)

N'intègre aucun paiement. Prévois uniquement une couche `entitlements` (gratuit / premium) isolée, sans l'activer, pour ajouter plus tard programmes avancés, statistiques détaillées, routines personnalisées, historique complet.

## 13. QUALITÉ

Avant de conclure : TypeScript strict sans erreur, ESLint propre, aucune erreur console, toutes routes testées, états vides et erreurs gérés (stockage indisponible, hors-ligne), formulaires validés, test manuel sur largeurs 375, 390, 430 px, iPad, 1366/1440/1920 px, installation PWA vérifiée (manifest + service worker + icône iOS), tests unitaires légers sur les calculs de statistiques, la sélection aléatoire des messages et le service de stockage. Vérifie qu'aucune dépendance payante n'a été introduite.

---

## 14. PHASES (avec points de contrôle)

1. Projet Next.js + TS + Tailwind, structure, lint. 
2. Design system vert (clair/sombre), logo, composants UI.
3. Fichiers de contenu : messages, intentions, situations de pression, 30 exercices, 4 programmes (**présente-moi un échantillon pour relecture avant de continuer**).
4. Landing page + SEO.
5. Navigation + boutons d'urgence + mode invité + service de stockage.
6. Routine pré-match.
7. Modes Point suivant, Erreur, Pression.
8. Analyse post-match + progression + dashboard.
9. Programmes + bibliothèque d'exercices + profil (export/import/suppression).
10. PWA + hors-ligne + optimisation mobile + accessibilité.
11. Pages légales.
12. Tests, corrections.
13. (Optionnel) Supabase Auth + synchronisation.
14. README complet (installation, lancement local, variables, Supabase, déploiement, installation PWA sur iPhone/Android, note hébergement non commercial) et préparation GitHub/déploiement.

**Résultat attendu** : une vraie web app fonctionnelle que je peux lancer en local, utiliser sur smartphone, installer en PWA, pousser sur GitHub et déployer gratuitement. Commence par analyser, proposer l'architecture en 15 lignes maximum, puis implémente.
