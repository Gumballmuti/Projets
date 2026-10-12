// Envoi d'une vidéo ou de captures d'écran depuis le téléphone ou l'ordinateur (n'importe quelle
// plateforme : vidéo enregistrée, enregistrement d'écran, captures d'un carrousel…). Netlify limite
// la taille d'une requête : la vidéo part en morceaux de 3 Mo, les captures une par une, réduites
// en JPEG. Identique dans les deux apps.
(() => {
  const TAILLE_MORCEAU = 3 * 1024 * 1024;
  const TAILLE_MAX = 150 * 1024 * 1024;
  const MAX_IMAGES = 35;

  async function requete(chemin, options) {
    const r = await fetch(chemin, options);
    if (r.status === 401) { location.href = "/connexion.html"; throw new Error("Non connecté"); }
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json.erreur || "Erreur " + r.status);
    return json;
  }

  // Une image de la vidéo, prise à ~1 s, pour la vignette.
  function miniature(fichier) {
    return new Promise(resolve => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(fichier);
      const fin = blob => { URL.revokeObjectURL(url); resolve(blob); };
      setTimeout(() => fin(null), 8000);
      Object.assign(video, { muted: true, playsInline: true, preload: "auto", src: url });
      video.addEventListener("loadeddata", () => { video.currentTime = Math.min(1, (video.duration || 2) / 3); }, { once: true });
      video.addEventListener("seeked", () => {
        const largeur = 360;
        const canvas = Object.assign(document.createElement("canvas"), {
          width: largeur, height: Math.round(largeur * (video.videoHeight / video.videoWidth || 16 / 9)) });
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(fin, "image/jpeg", 0.75);
      }, { once: true });
      video.addEventListener("error", () => fin(null), { once: true });
    });
  }

  // Réduit une capture (PNG, HEIC, JPEG…) en JPEG de 1600 px maximum : plus léger, et lisible par Gemini.
  async function reduire(fichier) {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = Object.assign(document.createElement("canvas"), {
      width: Math.round(image.width * echelle), height: Math.round(image.height * echelle) });
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return new Promise(ok => canvas.toBlob(ok, "image/jpeg", 0.85));
  }

  async function envoyerMorceau(chemin, morceau) {
    for (let essai = 0; ; essai++) {
      try {
        return await requete(chemin, { method: "PUT", body: morceau });
      } catch (e) {
        if (essai >= 2 || e.message === "Non connecté") throw e; // réseau mobile capricieux : on réessaie
        await new Promise(ok => setTimeout(ok, 1500));
      }
    }
  }

  const estImage = f => f.type.startsWith("image/") || /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name);

  /**
   * fichiers : une vidéo, ou une ou plusieurs captures d'écran (envoyées dans l'ordre où elles ont été choisies).
   * base : "/api/recettes" ou "/api/videos" ; progres(pourcentage) est appelé pendant l'envoi.
   */
  window.envoyerFichiers = async (fichiers, base, progres = () => {}) => {
    fichiers = [...fichiers];
    if (!fichiers.length) return;
    if (!fichiers.every(estImage)) {
      if (fichiers.length > 1) throw new Error("Choisis une seule vidéo, ou plusieurs captures d'écran.");
      return envoyerVideo(fichiers[0], base, progres);
    }
    if (fichiers.length > MAX_IMAGES) throw new Error(`${MAX_IMAGES} captures maximum.`);
    const { id } = await requete(`${base}/fichier`, { method: "POST" });
    for (let n = 0; n < fichiers.length; n++) {
      const jpeg = await reduire(fichiers[n]);
      if (n === 0) await requete(`${base}/${id}/miniature`, { method: "PUT", body: jpeg }).catch(() => null);
      await envoyerMorceau(`${base}/${id}/image/${n}`, jpeg);
      progres(Math.round(((n + 1) / fichiers.length) * 100));
    }
    await requete(`${base}/${id}/televerse`, { method: "POST" });
    return id;
  };

  async function envoyerVideo(fichier, base, progres) {
    if (!fichier.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm)$/i.test(fichier.name)) {
      throw new Error("Choisis un fichier vidéo.");
    }
    if (fichier.size > TAILLE_MAX) throw new Error("Vidéo trop lourde (150 Mo maximum).");
    const { id } = await requete(`${base}/fichier`, { method: "POST" });
    const image = await miniature(fichier).catch(() => null);
    if (image) await requete(`${base}/${id}/miniature`, { method: "PUT", body: image }).catch(() => null);
    const total = Math.max(1, Math.ceil(fichier.size / TAILLE_MORCEAU));
    for (let n = 0; n < total; n++) {
      await envoyerMorceau(`${base}/${id}/morceau/${n}`, fichier.slice(n * TAILLE_MORCEAU, (n + 1) * TAILLE_MORCEAU));
      progres(Math.round(((n + 1) / total) * 100));
    }
    await requete(`${base}/${id}/televerse`, { method: "POST" });
    return id;
  }
})();
