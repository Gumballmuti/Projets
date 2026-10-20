# Yfitops 🎧

App personnelle pour iPhone et Mac qui reprend le design et les fonctions de Spotify :
accueil, recherche, bibliothèque, playlists, titres likés, artistes, albums, genres, file d'attente,
lecture aléatoire, répétition, lecteur plein écran sur téléphone.

## D'où vient la musique

- **Le catalogue** (titres, artistes, albums, playlists, classements, genres) vient de l'API publique de **Deezer** :
  les mêmes artistes que sur Spotify.
- **Le son** est lu par le **lecteur officiel de YouTube**, caché : on n'entend que le son, sans vidéo.
  Chaque titre est retrouvé sur YouTube Music / YouTube grâce à **Odesli (song.link)** ; la réponse est gardée
  pour ne chercher chaque titre qu'une fois.
- **Secours** : si un titre n'est pas trouvé sur YouTube, l'app joue l'extrait officiel de 30 s de Deezer.

À savoir :
- Sur iPhone, Safari ne laisse pas une page lancer le son toute seule la première fois : si la lecture ne démarre pas,
  la vidéo s'affiche avec « Touche la vidéo pour lancer le son ». Un toucher suffit, la suite s'enchaîne ensuite.
- Le lecteur YouTube s'arrête quand l'écran de l'iPhone est verrouillé ou que l'app passe en arrière-plan
  (limite de YouTube dans Safari).
- Odesli accepte environ 10 recherches par minute. Pour aller plus vite, on peut ajouter une clé YouTube gratuite
  (`YOUTUBE_API_KEY`, voir plus bas).

## Hébergement (Vercel)

- `src/` : l'app (React + TypeScript, Vite).
- `api/index.ts` : le point d'entrée du serveur ; `vercel.json` y envoie toutes les adresses `/api/...`.
- `serveur/comptes.ts` : les comptes, **mêmes règles** que les apps de recettes et de films.
- `serveur/bibliotheque.ts` : la bibliothèque de chaque compte ; `serveur/stockage.ts` : rangée dans **Vercel Blob** (privé).
- `serveur/deezer.ts` : le relais vers le catalogue Deezer ; `serveur/youtube.ts` : la recherche des titres sur YouTube.

Réglages du projet Vercel :
- **Root Directory** : `Yfitops` (framework Vite, détecté tout seul ; fonctions à Paris, `cdg1`).
- Stockage : un **Blob store privé** relié au projet (crée la variable `BLOB_READ_WRITE_TOKEN`).
- Variables d'environnement :
  | Nom | Valeur |
  |---|---|
  | `APP_PASSWORD` | le mot de passe du compte admin (**obligatoire**) |
  | `YOUTUBE_API_KEY` | facultatif : clé « YouTube Data API v3 » gratuite (console.cloud.google.com), utilisée si Odesli ne trouve pas un titre |

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
