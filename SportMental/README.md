# Sport Mental 🎾

> *Ton meilleur jeu commence dans ta tête.*

Web app mobile-first installable (PWA) de **préparation mentale sportive**, pour le padel, le volley-ball et tous les sports de match.
Sans compte, gratuite, utilisable hors connexion : les données restent sur le téléphone.

- **Avant le match** : routine de 3 à 5 minutes (respiration, check-in d'énergie, objectif, intention, mot-clé, plan de rebond, visualisation).
- **Pendant le match** : trois boutons d'urgence, utilisables d'une main en moins de 5 secondes : *Point suivant*, *J'ai fait une erreur*, *Je suis sous pression*.
- **Après le match** : bilan sur 6 dimensions, recommandation, progression en courbes, carnet de preuves.
- **Entre les matchs** : 38 exercices et 4 programmes de 7 jours (erreurs, confiance, pression, concentration).

> Sport Mental est un outil de préparation mentale sportive. Il ne remplace pas l'avis ou l'accompagnement d'un professionnel de santé ou d'un psychologue.

---

## Sommaire

1. [Installation et lancement local](#1-installation-et-lancement-local)
2. [Scripts](#2-scripts)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Architecture](#4-architecture)
5. [Modifier le contenu (coachs)](#5-modifier-le-contenu-coachs)
6. [Données, compte et Supabase](#6-données-compte-et-supabase)
7. [Déploiement](#7-déploiement)
8. [Installer l'app sur iPhone et Android](#8-installer-lapp-sur-iphone-et-android)
9. [Hébergement gratuit et usage commercial : à lire](#9-hébergement-gratuit-et-usage-commercial--à-lire)
10. [Qualité et tests](#10-qualité-et-tests)

---

## 1. Installation et lancement local

Prérequis : **Node.js 20.9 ou plus récent** (Node 22 recommandé) et npm.

```bash
cd SportMental        # le projet est dans ce dossier du dépôt
npm install
npm run dev           # http://localhost:3000
```

Ouvre <http://localhost:3000> : la landing page s'affiche. « Commencer gratuitement » ouvre l'app.

Pour tester sur ton téléphone sur le même Wi-Fi : `npm run dev -- -H 0.0.0.0`, puis ouvre `http://<IP-de-ton-ordinateur>:3000`.
Le service worker (mode hors ligne) n'est actif qu'en production : `npm run build && npm start`.

## 2. Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build de production et serveur Next.js |
| `npm run build:static` | Export 100 % statique dans `out/` (Cloudflare Pages, Netlify, tout hébergeur statique) |
| `npm run typecheck` | TypeScript strict (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires (Vitest) |
| `npm run check` | Tout : typecheck + lint + tests + build |
| `npm run icons` | Régénère les icônes PNG à partir de `scripts/logo.svg` |

## 3. Variables d'environnement

Aucune n'est obligatoire. Copie `.env.example` en `.env.local` si besoin.

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL publique (sitemap, robots.txt, Open Graph). Ex. `https://sport-mental.vercel.app`. Sur Vercel, l'URL de production est détectée automatiquement. |

Aucun secret, aucune clé d'API : l'app n'appelle aucun service externe.

## 4. Architecture

```
SportMental/
├── src/
│   ├── app/
│   │   ├── (site)/          landing + pages légales (avec pied de page)
│   │   ├── (app)/           app : accueil, routine, exercices, programmes, progression, bilan, preuves, profil
│   │   ├── (bare)/          plein écran : première ouverture et modes match
│   │   ├── manifest.ts      manifest PWA
│   │   ├── precache.json/   liste des pages à garder hors ligne (générée au build)
│   │   └── robots.ts, sitemap.ts, opengraph-image.tsx, icon.svg, apple-icon.png
│   ├── content/             TOUT le contenu (messages, exercices, situations, programmes…)
│   ├── components/          ui/ (design system), match/ (écrans match), layout/, brand/ (logo)
│   ├── lib/                 storage (localStorage versionné), store, stats, random, entitlements…
│   └── hooks/
├── public/                  sw.js (service worker), icônes, _headers (hébergement statique)
├── scripts/                 génération des icônes
└── docs/cahier-des-charges.md
```

- **Next.js 16** (App Router), React 19, TypeScript strict, **Tailwind CSS v4**. Toutes les pages sont pré-rendues en statique.
- **3 dépendances d'exécution seulement** : `next`, `react`, `react-dom`. Graphiques en SVG maison, icônes maison, polices système.
- **Multi-sports** : chaque contenu porte un champ `sports` (`["all"]`, `["padel"]`, `["volley"]`). « Autre sport » ne voit que le contenu commun. Ajouter un sport = ajouter son identifiant dans `content/types.ts`, sa fiche dans `content/sports.ts` et son contenu.
- **Stockage** (`src/lib/storage.ts`) : une seule clé localStorage, enveloppe versionnée `{ version, savedAt, data }`, validation de toutes les données lues ou importées, migrations, gestion du quota plein et de la navigation privée (l'app continue en mémoire et prévient).
- **Service worker** (`public/sw.js`, sans dépendance) : à l'installation, met en cache toutes les pages listées par `/precache.json` et leurs fichiers `/_next/static`. Pages : réseau d'abord, cache en secours. Fichiers statiques : cache d'abord. Le cache est reconstruit à chaque nouvelle version déployée. Serwist a été écarté : il dépend de webpack alors que Next 16 compile avec Turbopack.
- **Monétisation** : `src/lib/entitlements.ts` isole une future offre premium (gratuit / premium). Elle n'est **pas activée** et ne contient aucun paiement.
- **Sécurité** : en-têtes (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) dans `next.config.ts`, et dans `public/_headers` pour l'export statique.

## 5. Modifier le contenu (coachs)

Tout le texte de l'app est dans `src/content/`, en TypeScript simple, lisible sans être développeur :

| Fichier | Contenu |
|---|---|
| `messages.ts` | Routine entre les points (Relâche · Lis · Décide · Engage) et 50 messages « Point suivant » |
| `routine.ts` | Routine pré-match : respiration, niveaux d'énergie, objectifs, intentions, mots-clés, plans de rebond, visualisations |
| `erreur.ts` | Mode « J'ai fait une erreur » : étapes, choix « ce que je contrôle », micro-consignes |
| `pression.ts` | 12 situations de pression, 5 écrans chacune |
| `exercices.ts` | 38 exercices (22 communs, 8 padel, 8 volley) |
| `programmes.ts` | 4 programmes de 7 jours |
| `bilan.ts` | Dimensions du bilan, recommandations, points positifs |
| `sante.ts` | Message de soutien et mots qui le déclenchent |
| `sports.ts` | Sports, vocabulaire, postes au volley |

Chaque élément a un champ `principe` (usage interne) qui indique lequel des 13 principes de contenu il applique.
`npm test` vérifie automatiquement la répartition par sport, les formulations négatives (« ne… pas »), les variantes express ≤ 20 s et la cohérence des programmes.

## 6. Données, compte et Supabase

**Choix retenu pour la V1 : pas de compte.** Le cahier des charges autorisait cette variante (données locales + export/import JSON), et c'est la plus adaptée :

- les notes sur l'état mental peuvent être des **données sensibles** au sens du RGPD : ne pas les collecter du tout est la meilleure protection ;
- 0 € et 0 maintenance de serveur, aucune base de données à sécuriser ;
- tout marche hors ligne, au club, sans réseau.

Le profil propose l'**export JSON** (sauvegarde, changement de téléphone), l'**import** (validé et nettoyé) et la **suppression complète**.

**Ajouter une synchronisation plus tard (Supabase Free)** : créer un projet Supabase, une table `matchs` avec Row Level Security (`user_id = auth.uid()`), ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`, ajouter le domaine Supabase à `connect-src` dans la CSP, et brancher la synchro sur `updateData` dans `src/lib/store.ts`. Il faudra obligatoirement demander un **consentement explicite** avant le premier envoi et mettre à jour la politique de confidentialité.

## 7. Déploiement

Le dépôt contient plusieurs projets : **pense à indiquer `SportMental` comme dossier racine** sur chaque hébergeur.

### Vercel (le plus simple, usage personnel uniquement : voir §9)

1. Va sur <https://vercel.com/new> et connecte-toi avec GitHub.
2. Importe le dépôt.
3. **Root Directory** : `SportMental`. Le framework (Next.js) est détecté automatiquement. Ne change ni la commande de build ni le dossier de sortie.
4. Facultatif : variable `NEXT_PUBLIC_SITE_URL` = ton URL finale (ou ton domaine).
5. **Deploy**. Chaque push sur `main` redéploie automatiquement.

### Netlify (gratuit, usage commercial autorisé)

- Nouveau site depuis Git → **Base directory** : `SportMental`. Netlify détecte Next.js et l'adaptateur s'installe tout seul.
- Ou en statique : Build command `npm run build:static`, Publish directory `SportMental/out`.

### Cloudflare Pages (gratuit, bande passante illimitée)

- Workers & Pages → Create → Pages → connecter le dépôt.
- **Root directory** : `SportMental` · **Build command** : `npm run build:static` · **Build output** : `out`.
- Variable d'environnement `NODE_VERSION` = `22`.
- Les en-têtes de sécurité sont lus dans `public/_headers`.

## 8. Installer l'app sur iPhone et Android

**iPhone (Safari obligatoire)**
1. Ouvre l'adresse du site dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.
4. Lance Sport Mental depuis son icône : plein écran, sans barre d'adresse. Après la première ouverture, l'app fonctionne hors ligne.

**Android (Chrome)**
- Une bannière « Installer l'application » peut apparaître. Sinon : menu ⋮ → **Installer l'application** (ou **Ajouter à l'écran d'accueil**). Le bouton « Installer l'app » du profil le propose aussi quand c'est possible.
- Un appui long sur l'icône donne accès aux raccourcis *Point suivant*, *Erreur* et *Pression*.

À savoir : sur iPhone, les vibrations ne sont pas disponibles pour les sites web. Si l'app installée n'est pas ouverte pendant plusieurs semaines, iOS peut effacer ses données : exporte-les régulièrement depuis le profil.

## 9. Hébergement gratuit et usage commercial : à lire

Vérifié en octobre 2026, à revérifier avant toute mise en production commerciale :

- **Vercel Hobby (gratuit)** est réservé à un **usage personnel et non commercial**. Les *Fair Use Guidelines* de Vercel considèrent comme commercial tout déploiement servant le gain financier d'une personne impliquée dans le projet. Tout usage commercial demande le plan **Pro** (payant) ou Enterprise. Sources : [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines).
- **Netlify Free** autorise l'usage commercial, dans la limite de **300 crédits par mois** (un déploiement de production ≈ 15 crédits, 1 Go de bande passante ≈ 20 crédits). Le service s'arrête jusqu'au mois suivant si les crédits sont épuisés : pas de facture surprise. Source : [netlify.com/pricing](https://www.netlify.com/pricing/).
- **Cloudflare Pages Free** : 500 builds par mois, requêtes et bande passante statiques illimitées. Les conditions de Cloudflare ne comportent pas de clause « non commercial » comparable à celle de Vercel (à confirmer dans leurs conditions au moment de la mise en production). Source : [Limites Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/).

**Quand migrer ?**
- **Tant que Sport Mental est un projet personnel, gratuit et sans revenus** : Vercel Hobby convient.
- **Dès que le projet sert une activité rémunérée** (offre premium, publicité, coaching payant qui l'utilise, ou développement payé par un client) : passer sur **Cloudflare Pages** ou **Netlify Free** avec `npm run build:static`, sans changer le code, ou prendre **Vercel Pro**.
- **Si le trafic dépasse les quotas gratuits de Netlify** : Cloudflare Pages (bande passante illimitée) ou un plan payant.

## 10. Qualité et tests

- `npm run check` : TypeScript strict, ESLint, 33 tests unitaires (service de stockage, statistiques et tendances, sélection aléatoire sans répétition, validation du contenu), puis build.
- Testé automatiquement sur toutes les routes à 375, 390, 430, 820 (iPad), 1366, 1440 et 1920 px, en clair et en sombre : aucune erreur console, aucun défilement horizontal.
- Parcours testés : première ouverture, routine, modes match (sans scroll dès 375 × 667), bilan, progression, programmes, export, suppression, **hors ligne**.
- Lighthouse mobile : performance 96 à 99, accessibilité 100, bonnes pratiques 100, SEO 100 sur la landing (les pages de l'app sont volontairement en `noindex`).
- Accessibilité : contrastes AA vérifiés, zones tactiles ≥ 48 px, focus visible, libellés, `prefers-reduced-motion` respecté (la respiration n'est plus animée).
- Aucune dépendance payante, aucun tracking, 0 vulnérabilité npm (dépendances de production).
