# Recon — Spotify (méthode Replica)

Reconstruction des **fonctions et des parcours** (salle blanche) : ni code, ni logo, ni textes, ni catalogue de Spotify.
Nom, logo et icônes sont propres à l'app (icônes Lucide, police Figtree). Catalogue : Audius (musique libre).

## Périmètre
Web (PWA iPhone + Mac), usage personnel. Boucle principale : trouver un titre → l'écouter → le ranger dans une playlist.

## Écrans
| ID | Écran | Route | Composants clés |
|---|---|---|---|
| S01 | Connexion | (sans session) | champs identifiant / mot de passe, œil, bouton vert |
| S02 | Accueil | `/` | salutation, accès rapide (8), étagères avec « Tout afficher » |
| S03 | Rechercher — parcourir | `/recherche` | recherches récentes, cartes de genres colorées |
| S04 | Rechercher — résultats | `/recherche/:q` | puces Tout/Titres/Artistes/Playlists/Albums, meilleur résultat |
| S05 | Playlist / album | `/playlist/:id` | en-tête dégradé, lecture, aléatoire, ajouter, « … », liste |
| S06 | Ma playlist | `/ma-playlist/:id` | mosaïque, modifier les infos, réordonner, « Trouvons quelque chose », recommandés |
| S07 | Titres likés | `/collection/titres` | dégradé violet, filtre, date d'ajout |
| S08 | Artiste | `/artiste/:id` | bannière, s'abonner, populaires, discographie, les fans aiment aussi, à propos |
| S09 | Genre | `/genre/:nom` | tendances du genre |
| S10 | Rubrique | `/section/:cle` | grille complète d'une étagère |
| S11 | Bibliothèque (mobile) | `/bibliotheque` | puces, tri, recherche |
| S12 | Compte | `/compte` | mot de passe ; admin : créer / gérer les comptes |
| — | Barre de lecture, panneau « En cours », file d'attente, mini-lecteur, lecteur plein écran, menus contextuels | | |

## Parcours
- F01 Écouter : Accueil → carte → ▶ (1 clic).
- F02 Chercher et écouter : Rechercher → texte → meilleur résultat ▶ (2 actions).
- F03 Créer une playlist et la remplir : + → « Trouvons quelque chose » → Ajouter (3 actions).
- F04 Ranger un titre : « … » / clic droit → Ajouter à la playlist → choisir.
- F05 Suivre un artiste, enregistrer une playlist ou un album.
- F06 Admin crée un compte → la personne se connecte et retrouve sa propre bibliothèque.

## Données
`Bibliotheque { playlists[], aimes[], artistes[], enregistrees[], recents[] }` par compte (Netlify Blobs) ;
titres, artistes et playlists d'Audius normalisés dans `src/types.ts`.

## Hors périmètre (impossible ou non voulu)
Catalogue des maisons de disques (droits), paroles, podcasts vidéo, Spotify Connect, mode hors-ligne
(téléchargements), Wrapped, social (amis, playlists collaboratives), publicités et abonnements.
