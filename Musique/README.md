# Ma musique 🎧

Petite app personnelle pour iPhone et Mac qui reprend le design et les fonctions de Spotify :
accueil, recherche, bibliothèque, playlists, titres likés, artistes, file d'attente, lecture aléatoire,
répétition, lecteur plein écran sur téléphone, commandes sur l'écran verrouillé.

La musique est **gratuite et légale** : elle vient d'[Audius](https://audius.org), une plateforme où des
artistes indépendants publient leurs morceaux en écoute libre (titres complets, sans publicité, sans compte Audius).
Les grands artistes des maisons de disques n'y sont pas : leur musique n'est jamais gratuite légalement.

## Comment ça marche

- `src/` : l'app (React + TypeScript, construite avec Vite).
  - `src/audius.ts` : le catalogue (tendances, recherche, artistes, playlists, albums, genres, lecture).
  - `src/etat/Lecteur.tsx` : le lecteur (file d'attente, aléatoire, répétition, reprise au même endroit).
  - `src/pages/` : les écrans ; `src/composants/` : barre de lecture, bibliothèque, menus…
- `netlify/functions/api.mts` : l'API (connexion, comptes, bibliothèque).
- `netlify/lib/comptes.mts` : les comptes, **identique** à celui de l'app de recettes et de l'app de films.
- `netlify/lib/bibliotheque.mts` : la bibliothèque de chaque compte (playlists, titres likés, artistes suivis,
  playlists et albums enregistrés, écoutés récemment), stockée dans Netlify Blobs : la même sur l'iPhone et sur le Mac.

Tout est gratuit : offre gratuite de Netlify, catalogue Audius sans clé.

## Hébergement (Netlify)

Réglages du projet Netlify :
- **Base directory** : `Musique` (le reste est dans `netlify.toml` : `npm run build`, dossier `dist`).
- Variables d'environnement :
  | Nom | Valeur |
  |---|---|
  | `APP_PASSWORD` | ton mot de passe pour entrer dans l'app (**obligatoire**) |
  | `VITE_AUDIUS_API_KEY` | facultatif : une clé Audius gratuite, seulement si Audius se met un jour à en demander une |

## Comptes

Comme dans les apps de recettes et de films :
- Le compte **admin** se connecte avec l'identifiant `admin` et le mot de passe `APP_PASSWORD`.
- Avec l'avatar en haut à droite → **Compte** (sur téléphone : l'avatar en haut de l'accueil), l'admin crée
  les comptes (identifiant + mot de passe), en change le mot de passe ou les supprime.
  Chaque personne a sa propre bibliothèque, que les autres ne voient pas.
- Les autres comptes peuvent changer leur mot de passe depuis la même page.
- Chaque app a ses comptes : une personne qui utilise aussi les recettes ou les films a besoin d'un compte dans chacune.

## Installer l'app

- **iPhone** : ouvre l'adresse dans Safari → bouton Partager → **Sur l'écran d'accueil**.
- **Mac** : ouvre l'adresse dans Safari → menu **Fichier → Ajouter au Dock**.

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

En local, l'API tourne dans Vite et les données sont rangées dans `.donnees-dev.json` (pas de Netlify nécessaire).
`APP_PASSWORD=autre npm run dev` pour changer le mot de passe admin local.
