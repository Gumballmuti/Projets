# CarOstéo 🦴

Dossiers patients pour le cabinet de Caroline Espartero Alonso, ostéopathe
(ostéopathie générale, migraines & céphalées, mâchoire & ATM, suivi sportif).
Inspiré de la partie « fiches patients » de Paramed, aux couleurs de ce-osteo.com.

## Ce que fait l'app

- **Liste des patients** : recherche (nom, téléphone, motif), filtres par spécialité, dossiers archivés.
- **Fiche patient** : identité, coordonnées, médecin traitant, dentiste, antécédents (médicaux, chirurgicaux,
  traumatiques, familiaux), traitements, allergies, contre-indications (affichées en rouge en tête de dossier),
  hygiène de vie, consentement RGPD.
- **Bilans spécifiques** selon le suivi coché : migraines (type, fréquence, signes, déclencheurs…),
  ATM (bruxisme, ouverture en mm, trajet, bruits, gouttière…), sport (niveau, volume, blessures…).
- **Historique des séances** : date, type, orientation, anamnèse, EVA avant/après, mesures propres à la spécialité,
  examen, diagnostic, zones traitées, techniques, conseils, suite à donner.
- **Imprimer / PDF** d'un dossier complet, **export** de tous ses dossiers (sauvegarde).
- Fonctionne sur ordinateur, iPhone et Android : les données sont sur le serveur, donc identiques partout.

## Hébergement (Vercel)

- `src/` : l'app (React + TypeScript, Vite). `commun/modele.ts` : les champs des fiches, partagés avec le serveur.
- `api/index.ts` : le point d'entrée du serveur ; `vercel.json` y envoie toutes les adresses `/api/...`.
- `serveur/comptes.ts` : les comptes, **mêmes règles** que les apps de recettes, de films et Yfitops.
- `serveur/dossiers.ts` : les dossiers de chaque compte ; `serveur/stockage.ts` : rangés **chiffrés** dans **Vercel Blob** (privé).

Réglages du projet Vercel :
- **Root Directory** : `CarOsteo` (framework Vite ; fonctions à Paris, `cdg1`).
- Stockage : un **Blob store privé** relié au projet (crée la variable `BLOB_READ_WRITE_TOKEN`).
- Variables d'environnement (en « Sensitive ») :
  | Nom | Valeur |
  |---|---|
  | `APP_PASSWORD` | le mot de passe du compte admin, **12 caractères minimum** (obligatoire) |
  | `CHIFFREMENT_CLE` | clé de chiffrement des données : `openssl rand -base64 32` (obligatoire, **à ne jamais perdre ni changer**) |

## Comptes

- Le compte **admin** se connecte avec l'identifiant `admin` et le mot de passe `APP_PASSWORD`.
  Il crée les comptes (identifiant + mot de passe proposé, à transmettre), en change le mot de passe ou les supprime,
  et voit le journal des connexions. **Il n'a pas accès aux dossiers patients** (secret médical).
- Chaque praticien a ses propres patients, que les autres comptes ne voient pas.
- Changer son mot de passe déconnecte tous ses autres appareils (téléphone perdu).

## Sécurité

- Aucune clé ni donnée dans le code envoyé au navigateur : tout passe par le serveur, qui vérifie la session à chaque appel.
- Session : cookie `HttpOnly`, `Secure`, `SameSite=Strict`, signé, valable 30 jours après la dernière utilisation.
- 5 mauvais mots de passe bloquent l'identifiant 15 minutes ; mots de passe hachés (scrypt), 10 caractères minimum.
- Données chiffrées (AES-256-GCM) avant d'être rangées : sans `CHIFFREMENT_CLE`, le stockage est illisible.
- Toutes les données reçues sont filtrées (champs connus, longueurs maximales, valeurs autorisées).
- Les modifications exigent l'en-tête `X-CarOsteo` : un autre site ne peut pas agir à la place de l'utilisatrice.
- En-têtes de sécurité stricts (CSP sans script externe, HSTS, anti-iframe, no-referrer), pas de source maps, `noindex`.

## Installer l'app

- **iPhone** : ouvre l'adresse dans Safari → Partager → **Sur l'écran d'accueil**.
- **Mac** : ouvre l'adresse dans Safari → **Fichier → Ajouter au Dock**.

## Travailler en local

```bash
npm install
npm run dev        # http://localhost:5173 — identifiant admin, mot de passe admin123
npm run typecheck
```

En local, le serveur tourne dans Vite et les données (chiffrées) vont dans `.donnees-dev.json`.
