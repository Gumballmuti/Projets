// Bouton 👤 « Mon compte » : changer son mot de passe, se déconnecter,
// et pour l'administrateur, créer et gérer les comptes. Identique dans les deux apps.
(() => {
  const style = document.createElement("style");
  style.textContent = `
#boutonCompte { position: fixed; top: calc(env(safe-area-inset-top) + 12px); right: 14px; z-index: 5;
  width: 42px; height: 42px; border-radius: 50%; padding: 0; font-size: 20px; border: 1px solid var(--bord);
  background: var(--carte); cursor: pointer; }
#fiche { z-index: 6; }
main h1 { padding-right: 52px; }
#compte { position: fixed; inset: 0; background: var(--fond); overflow-y: auto; display: none; z-index: 10;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom); color: var(--texte); }
#compte.ouvert { display: block; }
#compte .barre { position: sticky; top: 0; background: var(--fond); padding: 10px 16px; border-bottom: 1px solid var(--bord); }
#compte article { max-width: 560px; margin: 0 auto; padding: 16px 16px 60px; }
#compte h3 { font-size: 22px; margin: 18px 0 8px; }
#compte .carteC { background: var(--carte); border: 1px solid var(--bord); border-radius: 14px; padding: 14px; margin: 10px 0; }
#compte label { display: block; font-weight: 600; margin: 10px 0 4px; font-size: 15px; }
#compte input { font: inherit; width: 100%; padding: 11px 13px; border-radius: 12px; border: 1px solid var(--bord);
  background: var(--fond); color: var(--texte); }
#compte .ligneC { display: flex; gap: 8px; }
#compte .ligneC input { flex: 1; min-width: 0; }
#compte button { font: inherit; cursor: pointer; border: 0; border-radius: 12px; padding: 10px 14px;
  background: var(--accent-doux); color: var(--texte); }
#compte button.principal { background: var(--accent); color: #fff; font-weight: 600; }
#compte .danger { color: var(--erreur); }
#compte .doux { color: var(--doux); font-size: 14px; }
#compte .msg { margin-top: 10px; font-size: 14px; }
#compte .msg.ko { color: var(--erreur); }
#compte .utilisateur { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-top: 1px solid var(--bord); flex-wrap: wrap; }
#compte .utilisateur b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
#compte .utilisateur button { padding: 7px 10px; font-size: 14px; }
#compte .actionsC { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }`;
  document.head.append(style);

  const echapperC = t => String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const bouton = Object.assign(document.createElement("button"), { id: "boutonCompte", title: "Mon compte", textContent: "👤" });
  const panneau = Object.assign(document.createElement("div"), { id: "compte" });
  document.body.append(bouton, panneau);

  async function appel(chemin, methode = "GET", corps) {
    const r = await fetch(chemin, { method: methode, headers: { "Content-Type": "application/json" },
      body: corps ? JSON.stringify(corps) : undefined });
    const json = await r.json().catch(() => ({}));
    if (r.status === 401) { location.href = "/connexion.html"; throw new Error("Non connecté"); }
    if (!r.ok) throw new Error(json.erreur || "Erreur " + r.status);
    return json;
  }

  // Mot de passe facile à dicter : trois mots + un nombre
  function genererMotDePasse() {
    const mots = ["tarte", "cookie", "crepe", "gratin", "risotto", "tajine", "brioche", "fondant", "pesto",
      "paella", "quiche", "flan", "cinema", "popcorn", "serie", "bobine", "scene", "camera"];
    const n = new Uint32Array(4);
    crypto.getRandomValues(n);
    return [0, 1, 2].map(i => mots[n[i] % mots.length]).join("-") + "-" + (10 + n[3] % 90);
  }

  let moi = null;

  async function ouvrir(message = "", ko = false) {
    moi = await appel("/api/moi");
    let html = `<h3>Mon compte</h3><p>Compte : <b>${echapperC(moi.identifiant)}</b>${moi.admin ? " (administrateur)" : ""}</p>`;
    if (moi.admin) {
      const comptes = await appel("/api/utilisateurs");
      html += `<p class="doux">Ton mot de passe administrateur se change dans Netlify (variable APP_PASSWORD).</p>
        <h3>Créer un compte</h3>
        <div class="carteC">
          <p class="doux" style="margin-top:0">Chaque personne a sa propre collection, que personne d'autre ne voit.</p>
          <label>Identifiant</label><input id="cId" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="ex. julie">
          <label>Mot de passe</label>
          <div class="ligneC"><input id="cMdp" autocapitalize="none" autocorrect="off" spellcheck="false" value="${genererMotDePasse()}">
            <button data-c="generer" title="Proposer un autre mot de passe">🎲</button></div>
          <div class="actionsC"><button class="principal" data-c="creer">Créer le compte</button></div>
        </div>
        <h3>Comptes (${comptes.length})</h3>
        <div class="carteC">${comptes.length ? comptes.map(c => `
          <div class="utilisateur" data-id="${echapperC(c.identifiant)}"><b>${echapperC(c.identifiant)}</b>
            <button data-c="reinitialiser">Nouveau mot de passe</button>
            <button class="danger" data-c="supprimer">Supprimer</button></div>`).join("")
          : `<p class="doux" style="margin:0">Aucun compte pour l'instant.</p>`}</div>`;
    } else {
      html += `<h3>Changer mon mot de passe</h3>
        <div class="carteC">
          <label>Mot de passe actuel</label><input type="password" id="cAncien" autocomplete="current-password">
          <label>Nouveau mot de passe</label><input type="password" id="cNouveau" autocomplete="new-password">
          <div class="actionsC"><button class="principal" data-c="changer">Changer</button></div>
        </div>`;
    }
    html += `<div class="msg ${ko ? "ko" : ""}" id="cMsg">${message}</div>
      <div class="actionsC" style="margin-top:28px"><button class="danger" data-c="deconnexion">Se déconnecter</button></div>`;
    panneau.innerHTML = `<div class="barre"><button data-c="fermer">‹ Retour</button></div><article>${html}</article>`;
    panneau.classList.add("ouvert");
    document.body.style.overflow = "hidden";
  }

  function fermer() {
    panneau.classList.remove("ouvert");
    document.body.style.overflow = "";
  }

  const afficher = (texte, ko = false) => { const m = panneau.querySelector("#cMsg"); m.innerHTML = texte; m.className = "msg" + (ko ? " ko" : ""); };
  const val = id => panneau.querySelector(id).value;

  bouton.addEventListener("click", () => ouvrir().catch(e => alert(e.message)));
  panneau.addEventListener("click", async e => {
    const action = e.target.closest("[data-c]")?.dataset.c;
    const cible = e.target.closest(".utilisateur")?.dataset.id;
    try {
      if (action === "fermer") fermer();
      if (action === "generer") panneau.querySelector("#cMdp").value = genererMotDePasse();
      if (action === "creer") {
        const identifiant = val("#cId").trim().toLowerCase(), motDePasse = val("#cMdp");
        await appel("/api/utilisateurs", "POST", { identifiant, mot_de_passe: motDePasse });
        await ouvrir(`✅ Compte créé. À transmettre : adresse <b>${echapperC(location.origin)}</b>, identifiant <b>${echapperC(identifiant)}</b>, mot de passe <b>${echapperC(motDePasse)}</b>`);
      }
      if (action === "reinitialiser") {
        const motDePasse = prompt(`Nouveau mot de passe pour « ${cible} » :`, genererMotDePasse());
        if (!motDePasse) return;
        await appel(`/api/utilisateurs/${encodeURIComponent(cible)}`, "PUT", { mot_de_passe: motDePasse });
        await ouvrir(`✅ Nouveau mot de passe de <b>${echapperC(cible)}</b> : <b>${echapperC(motDePasse)}</b>`);
      }
      if (action === "supprimer" && confirm(`Supprimer le compte « ${cible} » et toute sa collection ? C'est définitif.`)) {
        await appel(`/api/utilisateurs/${encodeURIComponent(cible)}`, "DELETE");
        await ouvrir(`Compte « ${echapperC(cible)} » supprimé.`);
      }
      if (action === "changer") {
        await appel("/api/mot-de-passe", "POST", { ancien: val("#cAncien"), nouveau: val("#cNouveau") });
        await ouvrir("✅ Mot de passe changé.");
      }
      if (action === "deconnexion") {
        await appel("/api/deconnexion", "POST");
        location.href = "/connexion.html";
      }
    } catch (err) { afficher(echapperC(err.message), true); }
  });
})();
