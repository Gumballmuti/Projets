# Propulse Agency — site vitrine & portfolio

Site multipage de Propulse Agency : accueil, services, réalisations (avec études de cas), agence, contact et pages légales (mentions légales, confidentialité, cookies).

Site statique généré par un petit script Node (aucune dépendance), avec une fonction serveur pour le formulaire de contact.

## Structure

```
site.config.json      Coordonnées, informations légales, réseaux sociaux
build.mjs             Génère le site final dans dist/
serve.mjs             Aperçu local
api/contact.js        Réception du formulaire (envoi par e-mail)
src/pages/            Pages du site
src/partials/         En-tête, pied de page, bandeau cookies, logo
src/projects/         Données des projets, modèle d'étude de cas, illustrations
src/assets/           CSS, JS, polices et librairies (hébergées localement)
```

## Commandes

```bash
npm run build   # génère dist/
npm run dev     # génère puis lance l'aperçu sur http://localhost:4173
```

## À compléter avant la mise en ligne définitive

Dans `site.config.json`, remplacer les valeurs entre crochets (obligatoires en Belgique) :

- `legal.company`, `legal.form`, `legal.address` : dénomination, forme juridique, adresse ;
- `legal.bce`, `legal.vat` : numéro d'entreprise BCE et numéro de TVA ;
- `legal.publisher` : responsable de la publication ;
- `contact.phone` / `contact.phoneHref` : numéro de téléphone ;
- `social.*` : liens vers les profils Instagram, LinkedIn et Behance ;
- `url` : adresse définitive du site (balises canoniques et sitemap).

Puis relancer `npm run build` (Vercel le fait automatiquement à chaque déploiement).

## Formulaire de contact

Le formulaire envoie les demandes par e-mail via [Resend](https://resend.com). Variables d'environnement à définir dans Vercel (Settings › Environment Variables) :

| Variable | Exemple |
| --- | --- |
| `RESEND_API_KEY` | clé API Resend |
| `CONTACT_TO` | `contact@propulse-agency.be` |
| `CONTACT_FROM` | `Site Propulse <site@propulse-agency.be>` (domaine vérifié chez Resend) |

Tant que ces variables ne sont pas définies, le formulaire ouvre automatiquement la messagerie du visiteur avec le message pré-rempli : aucune demande n'est perdue.

## Déploiement sur Vercel

Add New › Project › importer le dépôt `Projets` › **Root Directory** `Propulse-Agency-Test`, Framework Preset **Other**. Le reste (build, dossier de sortie, URL propres, en-têtes de sécurité) est dans `vercel.json`.

## Conformité

- Mentions légales conformes au Code de droit économique (art. III.74 et XII.6).
- Politique de confidentialité RGPD (finalités, bases légales, durées, sous-traitants, droits, APD).
- Bandeau cookies : aucun traceur optionnel sans accord, refus aussi simple que l'acceptation, choix conservé 6 mois et modifiable via « Gérer mes cookies ».
- Polices et scripts hébergés localement : aucune donnée transmise à des tiers pendant la navigation.
- Formulaire : données minimales, information claire, champ anti-spam, aucun stockage sur le serveur.
