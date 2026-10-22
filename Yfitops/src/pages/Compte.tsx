import { Dices, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { appel } from "../api";
import { useSession } from "../etat/Session";

// Mot de passe facile à dicter : trois mots + un nombre
function genererMotDePasse() {
  const mots = ["vinyle", "refrain", "guitare", "piano", "tempo", "melodie", "basse", "concert", "disque",
    "batterie", "accord", "chorus", "groove", "platine", "synthe", "violon", "rythme", "studio"];
  const n = new Uint32Array(4);
  crypto.getRandomValues(n);
  return [0, 1, 2].map((i) => mots[n[i] % mots.length]).join("-") + "-" + (10 + (n[3] % 90));
}

/** Mon compte : changer de mot de passe ; pour l'administrateur, créer et gérer les comptes. */
export default function Compte() {
  const { moi, deconnecte } = useSession();
  const [comptes, setComptes] = useState<{ identifiant: string; cree_le: string }[]>([]);
  const [message, setMessage] = useState<{ texte: React.ReactNode; ko?: boolean } | null>(null);
  const [nouvelId, setNouvelId] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState(genererMotDePasse);
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");

  const charger = useCallback(() => {
    if (moi.admin) appel("utilisateurs").then(setComptes).catch((e) => setMessage({ texte: e.message, ko: true }));
  }, [moi.admin]);
  useEffect(charger, [charger]);

  const essayer = async (f: () => Promise<React.ReactNode>) => {
    try {
      setMessage({ texte: await f() });
      charger();
    } catch (e) {
      setMessage({ texte: (e as Error).message, ko: true });
    }
  };

  return (
    <div className="page page-compte">
      <h1>Mon compte</h1>
      <p>Compte : <b>{moi.identifiant}</b>{moi.admin && " (administrateur)"}</p>

      {moi.admin ? (
        <>
          <p className="doux">Ton mot de passe administrateur se change dans Vercel (variable APP_PASSWORD).</p>
          <h2>Créer un compte</h2>
          <div className="carte-compte">
            <p className="doux">Chaque personne a sa propre bibliothèque (playlists, titres likés, artistes), que personne d'autre ne voit.</p>
            <label htmlFor="cId">Identifiant</label>
            <input id="cId" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="ex. julie"
              value={nouvelId} onChange={(e) => setNouvelId(e.target.value)} />
            <label htmlFor="cMdp">Mot de passe</label>
            <div className="ligne-champ">
              <input id="cMdp" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={nouveauMdp} onChange={(e) => setNouveauMdp(e.target.value)} />
              <button className="bouton-gris" title="Proposer un autre mot de passe" aria-label="Proposer un autre mot de passe"
                onClick={() => setNouveauMdp(genererMotDePasse())}><Dices size={18} /></button>
            </div>
            <button className="bouton-vert" onClick={() => essayer(async () => {
              const identifiant = nouvelId.trim().toLowerCase();
              await appel("utilisateurs", "POST", { identifiant, mot_de_passe: nouveauMdp });
              setNouvelId("");
              setNouveauMdp(genererMotDePasse());
              return <>✅ Compte créé. À transmettre : adresse <b>{location.origin}</b>, identifiant <b>{identifiant}</b>, mot de passe <b>{nouveauMdp}</b></>;
            })}>Créer le compte</button>
          </div>
          <h2>Comptes ({comptes.length})</h2>
          <div className="carte-compte">
            {comptes.length ? comptes.map((c) => (
              <div className="utilisateur" key={c.identifiant}>
                <b>{c.identifiant}</b>
                <button className="bouton-gris" onClick={() => {
                  const mdp = prompt(`Nouveau mot de passe pour « ${c.identifiant} » :`, genererMotDePasse());
                  if (mdp) essayer(async () => {
                    await appel(`utilisateurs/${encodeURIComponent(c.identifiant)}`, "PUT", { mot_de_passe: mdp });
                    return <>✅ Nouveau mot de passe de <b>{c.identifiant}</b> : <b>{mdp}</b></>;
                  });
                }}>Nouveau mot de passe</button>
                <button className="bouton-gris danger" onClick={() => {
                  if (confirm(`Supprimer le compte « ${c.identifiant} » et toute sa bibliothèque ? C'est définitif.`)) essayer(async () => {
                    await appel(`utilisateurs/${encodeURIComponent(c.identifiant)}`, "DELETE");
                    return `Compte « ${c.identifiant} » supprimé.`;
                  });
                }}>Supprimer</button>
              </div>
            )) : <p className="doux">Aucun compte pour l'instant.</p>}
          </div>
        </>
      ) : (
        <>
          <h2>Changer mon mot de passe</h2>
          <div className="carte-compte">
            <label htmlFor="cAncien">Mot de passe actuel</label>
            <input id="cAncien" type="password" autoComplete="current-password" value={ancien} onChange={(e) => setAncien(e.target.value)} />
            <label htmlFor="cNouveau">Nouveau mot de passe</label>
            <input id="cNouveau" type="password" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
            <button className="bouton-vert" onClick={() => essayer(async () => {
              await appel("mot-de-passe", "POST", { ancien, nouveau });
              setAncien("");
              setNouveau("");
              return "✅ Mot de passe changé.";
            })}>Changer</button>
          </div>
        </>
      )}
      {message && <p className={"message-compte" + (message.ko ? " ko" : "")} role="status">{message.texte}</p>}
      <button className="bouton-contour deconnexion" onClick={async () => {
        await appel("deconnexion", "POST").catch(() => {});
        deconnecte();
      }}><LogOut size={16} /> Se déconnecter</button>
    </div>
  );
}
