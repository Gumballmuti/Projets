// Envoi d'une vidéo depuis le téléphone ou l'ordinateur (n'importe quelle plateforme :
// vidéo enregistrée, enregistrement d'écran…). Netlify limite la taille d'une requête,
// alors la vidéo part en morceaux de 3 Mo. Identique dans les deux apps.
(() => {
  const TAILLE_MORCEAU = 3 * 1024 * 1024;
  const TAILLE_MAX = 150 * 1024 * 1024;

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

  /** base : "/api/recettes" ou "/api/videos" ; progres(pourcentage) est appelé pendant l'envoi. */
  window.envoyerVideo = async (fichier, base, progres = () => {}) => {
    if (!fichier.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm)$/i.test(fichier.name)) {
      throw new Error("Choisis un fichier vidéo.");
    }
    if (fichier.size > TAILLE_MAX) throw new Error("Vidéo trop lourde (150 Mo maximum).");
    const { id } = await requete(`${base}/fichier`, { method: "POST" });
    const image = await miniature(fichier).catch(() => null);
    if (image) await requete(`${base}/${id}/miniature`, { method: "PUT", body: image }).catch(() => null);
    const total = Math.max(1, Math.ceil(fichier.size / TAILLE_MORCEAU));
    for (let n = 0; n < total; n++) {
      const morceau = fichier.slice(n * TAILLE_MORCEAU, (n + 1) * TAILLE_MORCEAU);
      for (let essai = 0; ; essai++) {
        try {
          await requete(`${base}/${id}/morceau/${n}`, { method: "PUT", body: morceau });
          break;
        } catch (e) {
          if (essai >= 2 || e.message === "Non connecté") throw e; // réseau mobile capricieux : on réessaie
          await new Promise(ok => setTimeout(ok, 1500));
        }
      }
      progres(Math.round(((n + 1) / total) * 100));
    }
    await requete(`${base}/${id}/televerse`, { method: "POST" });
    return id;
  };
})();
