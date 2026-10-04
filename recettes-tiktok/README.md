# Mes recettes TikTok 🍳

Petite app personnelle pour iPhone et Mac : tu colles le lien d'une vidéo TikTok,
et l'app te range une recette écrite (titre donné par le créateur, ingrédients, étapes, astuces).

## Comment ça marche

1. L'app lit la **description** de la vidéo et ses **sous-titres** (ce qui est dit, quand TikTok les fournit).
2. Claude rédige la recette à partir de ces textes.
3. Si la recette n'est pas dans la description, l'app **télécharge la vidéo**, en extrait 16 images
   et Claude « regarde » la vidéo pour écrire la recette.
4. Les recettes sont stockées dans Netlify (Netlify Blobs) : les mêmes sur l'iPhone et sur le Mac.

Dans l'app : recherche par nom ou ingrédient, ingrédients à cocher et étapes à barrer pendant que tu cuisines,
modification, copie du texte, « Réanalyser avec la vidéo », et « Coller la recette à la main » si TikTok bloque.

## Hébergement (Netlify)

- `public/` : les pages (app installable sur l'écran d'accueil).
- `netlify/functions/api.mts` : l'API (connexion, liste, ajout, modification, suppression).
- `netlify/functions/analyse-background.mts` : l'analyse (jusqu'à 15 min), qui lit TikTok et appelle Claude.

Réglages du projet Netlify :
- **Base directory** : `recettes-tiktok` (les autres réglages sont dans `netlify.toml`).
- Variables d'environnement :
  | Nom | Valeur |
  |---|---|
  | `ANTHROPIC_API_KEY` | clé API Anthropic (https://console.anthropic.com → API Keys) |
  | `APP_PASSWORD` | ton mot de passe pour entrer dans l'app (**obligatoire**) |

Coût Claude : environ 1 à 3 centimes par recette lue dans la description, environ 10 centimes quand il faut regarder la vidéo.

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
**Réessayer en regardant la vidéo**, ou **Coller la recette à la main** (copie la description depuis TikTok, Claude la met en forme).
