# Mes recettes TikTok 🍳

Petite app personnelle pour iPhone et Mac : tu colles le lien d'une vidéo TikTok,
et l'app te range une recette écrite (titre donné par le créateur, ingrédients, étapes, astuces).

## Comment ça marche

1. L'app lit la **description** de la vidéo, ses **sous-titres** et télécharge la **vidéo**.
2. **Google Gemini** (offre gratuite) regarde la vidéo, avec le son, et rédige la recette.
3. Les recettes sont stockées dans Netlify (Netlify Blobs) : les mêmes sur l'iPhone et sur le Mac.

Tout est gratuit : offre gratuite de Netlify et offre gratuite de l'API Gemini (sans carte bancaire).
À savoir : sur l'offre gratuite, Google peut utiliser ce que tu envoies à Gemini pour améliorer ses produits
(ici, des vidéos TikTok publiques).

Dans l'app : recherche par nom ou ingrédient, ingrédients à cocher et étapes à barrer pendant que tu cuisines,
modification, copie du texte, « Réanalyser », et « Coller la recette à la main » si TikTok bloque.

## Hébergement (Netlify)

- `public/` : les pages (app installable sur l'écran d'accueil).
- `netlify/functions/api.mts` : l'API (connexion, liste, ajout, modification, suppression).
- `netlify/functions/analyse-background.mts` : l'analyse en arrière-plan, qui lit TikTok et appelle Gemini.
  Si le plan Netlify ne la lance pas, la page déclenche l'analyse elle-même (`/api/recettes/:id/analyser`).

Réglages du projet Netlify :
- **Base directory** : `recettes-tiktok` (les autres réglages sont dans `netlify.toml`).
- Variables d'environnement :
  | Nom | Valeur |
  |---|---|
  | `GEMINI_API_KEY` | clé API Gemini gratuite (https://aistudio.google.com/apikey) |
  | `APP_PASSWORD` | ton mot de passe pour entrer dans l'app (**obligatoire**) |
  | `GEMINI_MODEL` | facultatif, `gemini-flash-latest` par défaut |

## Installer l'app

- **iPhone** : ouvre l'adresse dans Safari → bouton Partager → **Sur l'écran d'accueil**.
- **Mac** : ouvre l'adresse dans Safari → menu **Fichier → Ajouter au Dock**.

### Ajouter une recette directement depuis TikTok (iPhone)

Dans l'app **Raccourcis** :
1. Nouveau raccourci → ⓘ → active **Afficher dans la feuille de partage** (entrée : URL et Texte).
2. Action **Encoder en URL** (entrée : *Entrée du raccourci*).
3. Action **Ouvrir les URL** : `https://TON-ADRESSE/?ajout=` suivi de *Texte encodé*.
4. Nomme-le « Ajouter aux recettes ».

Dans TikTok : Partager → Plus (…) → « Ajouter aux recettes ».

## Si une vidéo ne passe pas

TikTok bloque parfois les serveurs. Sur la fiche en erreur :
**Réessayer**, ou **Coller la recette à la main** (copie la description depuis TikTok, Gemini la met en forme).
