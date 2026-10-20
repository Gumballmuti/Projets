# Yfitops 🎧

App personnelle pour iPhone et Mac qui reprend le design et les fonctions de Spotify :
accueil, recherche, bibliothèque, playlists, titres likés, artistes, albums, genres, file d'attente,
lecture aléatoire, répétition, lecteur plein écran sur téléphone.

## D'où vient la musique

- **Le catalogue** (titres, artistes, albums, playlists, classements, genres) vient de l'API publique de **Deezer** :
  les mêmes artistes que sur Spotify.
- **Le son** est lu par le **lecteur officiel de YouTube**, caché : on n'entend que le son, sans vidéo.
  Chaque titre est retrouvé grâce à la **recherche YouTube officielle** (clé gratuite `YOUTUBE_API_KEY`) :
  on garde la vidéo dont la durée colle au titre, et la réponse est gardée pour ne chercher chaque titre qu'une fois.
- **Pubs** : le lecteur YouTube peut insérer des pubs audio (c'est ce qui paie les artistes) ; l'app n'en ajoute aucune.
- **Secours** : si un titre n'est pas trouvé sur YouTube (ou sans clé), l'app joue l'extrait officiel de 30 s de Deezer.

À savoir :
- Sur iPhone, Safari ne laisse pas une page lancer le son toute seule la première fois : si la lecture ne démarre pas,
  la vidéo s'affiche avec « Touche la vidéo pour lancer le son ». Un toucher suffit, la suite s'enchaîne ensuite.
- Le lecteur YouTube s'arrête quand l'écran de l'iPhone est verrouillé ou que l'app passe en arrière-plan
  (limite de YouTube dans Safari).
- Le quota gratuit de YouTube permet de chercher environ **100 nouveaux titres par jour** (pour tous les comptes ensemble) ;
  un titre déjà trouvé ne coûte plus rien. Au-delà, les nouveaux titres passent en extrait de 30 s jusqu'au lendemain.

### Créer la clé YouTube (gratuit, 5 minutes)

1. Va sur https://console.cloud.google.com → crée un projet (ex. « Yfitops »).
2. Menu **API et services → Bibliothèque** → cherche **YouTube Data API v3** → **Activer**.
3. **API et services → Identifiants → Créer des identifiants → Clé API**. Copie la clé.
4. Dans Vercel : projet **yfitops → Settings → Environment Variables** → `YOUTUBE_API_KEY` = la clé, puis redéploie.

## Hébergement (Vercel)

- `src/` : l'app (React + TypeScript, Vite).
- `api/index.ts` : le point d'entrée du serveur ; `vercel.json` y envoie toutes les adresses `/api/...`.
- `serveur/comptes.ts` : les comptes, **mêmes règles** que les apps de recettes et de films.
- `serveur/bibliotheque.ts` : la bibliothèque de chaque compte ; `serveur/stockage.ts` : rangée dans **Vercel Blob** (privé).
- `serveur/deezer.ts` : le relais vers le catalogue Deezer ; `serveur/youtube.ts` : la recherche des titres sur YouTube. `/api/sante` : diagnostic (Deezer, YouTube, stockage).

Réglages du projet Vercel :
- **Root Directory** : `Yfitops` (framework Vite, détecté tout seul ; fonctions à Paris, `cdg1`).
- Stockage : un **Blob store privé** relié au projet (crée la variable `BLOB_READ_WRITE_TOKEN`).
- Variables d'environnement :
  | Nom | Valeur |
  |---|---|
  | `APP_PASSWORD` | le mot de passe du compte admin (**obligatoire**) |
  | `YOUTUBE_API_KEY` | clé « YouTube Data API v3 » gratuite : **nécessaire pour les morceaux complets** (sinon extraits de 30 s) |

## Comptes

Comme dans les apps de recettes et de films :
- Le compte **admin** se connecte avec l'identifiant `admin` et le mot de passe `APP_PASSWORD`.
- Avatar en haut à droite → **Compte** (sur téléphone : l'avatar en haut de l'accueil). L'admin y crée les comptes
  (identifiant + mot de passe proposé, à transmettre), change un mot de passe ou supprime un compte.
  Chaque personne a sa propre bibliothèque, que les autres ne voient pas.
- Les autres comptes changent leur mot de passe depuis la même page.

## Installer l'app

- **iPhone** : ouvre l'adresse dans Safari → Partager → **Sur l'écran d'accueil**.
- **Mac** : ouvre l'adresse dans Safari → **Fichier → Ajouter au Dock**.

## Raccourcis

- **Espace** : lecture / pause. **Ctrl/Cmd + K** : rechercher.
- Clic droit (ou « … ») sur un titre : ajouter à une playlist, à la file d'attente, aux titres likés, aller à l'artiste.
- Double-clic sur un titre pour le lancer ; dans tes playlists, glisse les titres pour changer l'ordre.

## Travailler en local

```bash
npm install
npm run dev        # http://localhost:5173 — identifiant admin, mot de passe admin123
npm run typecheck
```

En local, le serveur tourne dans Vite et les données vont dans `.donnees-dev.json`.
