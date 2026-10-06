# Ma Route 🛣️

Ma petite app GPS perso, entre Google Maps, Waze et Coyote, pour iPhone (et tout navigateur) :

- **Carte** plein écran qui me suit, orientée dans le sens de la route quand je roule, sombre la nuit.
- **Compteur de vitesse** et **panneau de limitation** de la route où je suis ; le compteur passe au rouge et bipe si je dépasse (tolérance réglable).
- **Zones de danger** : les radars fixes (fixes, feux rouges, tronçons, passages à niveau) de toute la France et de l'Europe, avec une alerte sonore et vocale (« Zone de danger, limitation 80 ») quand j'arrive dessus.
- **Signalements** (bouton orange ＋, ou appui long sur la carte) : radar mobile, contrôle, radar fixe manquant, feu rouge, danger, bouchon. Ils m'alertent ensuite comme les radars fixes et disparaissent tout seuls (radar mobile 3 h, contrôle 2 h, danger et bouchon 1 h ; les radars fixes que j'ajoute restent).
- **Itinéraires** : recherche d'adresse, plusieurs trajets au choix avec le nombre de zones sur chacun, option « éviter les péages », guidage vocal en français, recalcul automatique si je me trompe de route.
- Pas de compte, pas de pub : tout reste sur le téléphone (export/import des signalements dans les réglages).

## Pourquoi « zones de danger » et pas « radars » ?

En France, les détecteurs de radars sont interdits (art. R413-15 du Code de la route : 1 500 € d'amende, 6 points, confiscation).
Les apps comme Coyote et Waze sont légales parce qu'elles annoncent des **zones de danger** sans donner l'emplacement exact du radar.
L'app fait pareil : les alertes parlent de « zone de danger » (radars fixes) ou de « zone à risque » (radars mobiles et contrôles), sans compte à rebours jusqu'au radar.

## D'où viennent les données (gratuites, sans clé)

| Quoi | Source |
|---|---|
| Fond de carte | [OpenFreeMap](https://openfreemap.org) (OpenStreetMap), secours : tuiles OpenStreetMap |
| Radars fixes et limitations | [OpenStreetMap](https://www.openstreetmap.org) via l'API Overpass, gardés 7 jours sur le téléphone |
| Adresses | Géoplateforme de l'IGN (adresses françaises) + [Photon](https://photon.komoot.io) (lieux, étranger) |
| Itinéraires | [OSRM](https://project-osrm.org) (serveur de démonstration, secours : FOSSGIS) |

Limites à connaître :
- **Radars mobiles** : il n'y a pas de communauté comme sur Waze ou Coyote, donc l'app ne connaît que ceux que je signale moi-même.
- Les radars et limitations viennent d'OpenStreetMap : c'est très complet en France, mais il peut manquer une installation récente. Je peux l'ajouter avec ＋ › Radar fixe. Les panneaux sur la route font toujours foi.
- Sur iPhone, une web app ne tourne pas en arrière-plan : **l'écran doit rester allumé** et l'app au premier plan (elle demande à garder l'écran allumé quand je roule). Mieux vaut brancher le téléphone en voiture.

## Hébergement (Vercel ou Netlify, gratuit)

C'est un site 100 % statique (dossier `public/`), sans build ni clé d'API.

- **Vercel** : Add New › Project › importer le dépôt `Projets` › **Root Directory** `Radars`, Framework Preset **Other** (le reste est dans `vercel.json`).
- **Netlify** : **Base directory** `Radars` (le reste est dans `netlify.toml`).

Il faut du HTTPS pour que le GPS fonctionne : les deux le fournissent.

## Installer l'app sur l'iPhone

1. Ouvrir l'adresse Netlify dans **Safari**.
2. Partager › **Sur l'écran d'accueil**.
3. Au premier lancement, accepter la localisation (« Lorsque l'app est active »).
   Si j'ai refusé : Réglages › Confidentialité › Service de localisation › Safari.
4. Toucher l'écran une fois au démarrage pour activer le son (règle d'iOS).

## Développement

```bash
cd Radars
npm start        # http://localhost:8080
npm test         # tests de la logique (alertes, radars, consignes, signalements)
npm run icones   # régénère les icônes depuis scripts/icone.svg (Playwright requis)
```

Code (JavaScript sans framework, dans `public/js/`) :

| Fichier | Rôle |
|---|---|
| `app.js` | Interface, carte (MapLibre), GPS, navigation à l'écran |
| `alertes.js` | Entrée / sortie des zones de danger |
| `radars.js` | Radars OpenStreetMap, cache par secteurs |
| `limites.js` | Limitation de la route où je roule |
| `navigation.js` | Recherche d'adresse, itinéraires, consignes en français |
| `signalements.js` | Mes signalements (stockés sur le téléphone) |
| `voix.js` | Voix et bips |
| `geo.js` | Calculs de distances et d'angles |
