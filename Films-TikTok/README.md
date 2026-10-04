# Mes films & séries TikTok 🎬

Petite app personnelle pour iPhone et Mac : tu colles le lien d'une vidéo TikTok qui recommande des films
ou des séries, et chaque titre rejoint ta bibliothèque, classée en **Films** et **Séries**.

## Comment ça marche

1. L'app lit la **description** de la vidéo, ses **sous-titres** et télécharge la **vidéo**.
2. **Google Gemini** (offre gratuite) regarde la vidéo, avec le son, et repère tous les titres recommandés,
   avec l'année, les genres, un résumé sans spoiler, les plateformes citées et l'avis du créateur.
3. Un même film recommandé par plusieurs vidéos n'apparaît qu'une fois.

Dans l'app : onglets « À voir » / « Déjà vus » / « Vidéos TikTok », filtre par genre, recherche,
bouton ✓ pour marquer un titre comme vu, liens JustWatch (où le regarder) et bande-annonce,
modification, et « Coller la liste à la main » si TikTok bloque.

## Hébergement (Netlify, gratuit)

- `public/` : les pages (app installable sur l'écran d'accueil).
- `netlify/functions/api.mts` : l'API (connexion, films et séries, vidéos).
- `netlify/functions/analyse-background.mts` : l'analyse en arrière-plan ; si le plan Netlify ne la lance pas,
  la page déclenche l'analyse elle-même (`/api/videos/:id/analyser`).

Réglages du projet Netlify :
- **Base directory** : `Films-TikTok`
- Variables d'environnement : `GEMINI_API_KEY` (https://aistudio.google.com/apikey), `APP_PASSWORD`,
  et facultativement `GEMINI_MODEL`.

## Installer l'app

- **iPhone** : ouvre l'adresse dans Safari → Partager → **Sur l'écran d'accueil**.
- **Mac** : ouvre l'adresse dans Safari → **Fichier → Ajouter au Dock**.

Raccourci iPhone pour ajouter depuis TikTok : même principe que l'app recettes,
avec l'URL `https://TON-ADRESSE/?ajout=` suivie du *Texte encodé*.
