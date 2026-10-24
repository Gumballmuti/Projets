import { Download, KeyRound, LogOut, Trash2, Upload, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { appel } from "../api";
import { useMoi } from "../App";
import { Champ, Message } from "../composants/Champs";

/** Mot de passe proposé : 14 caractères, lettres et chiffres, sans caractères ambigus. */
function proposerMotDePasse() {
  const lettres = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const chiffres = "23456789";
  const tout = lettres + chiffres;
  const octets = crypto.getRandomValues(new Uint32Array(14));
  const mdp = Array.from(octets, (n) => tout[n % tout.length]);
  mdp[3] = chiffres[octets[3] % chiffres.length];
  mdp[9] = chiffres[octets[9] % chiffres.length];
  return mdp.join("");
}

export default function Compte() {
  const { moi, deconnecter } = useMoi();
  return (
    <>
      <div className="entete">
        <div>
          <h1>{moi.admin ? "Administration" : "Mon compte"}</h1>
          <p>Connecté en tant que <b>{moi.identifiant}</b></p>
        </div>
        <button className="bouton leger" onClick={deconnecter}><LogOut size={18} />Se déconnecter</button>
      </div>
      {moi.admin ? <Admin /> : <MonCompte />}
    </>
  );
}

function MonCompte() {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [msg, setMsg] = useState<{ erreur?: string; ok?: string }>({});

  const changer = async (e: FormEvent) => {
    e.preventDefault();
    if (nouveau !== confirmation) return setMsg({ erreur: "Les deux nouveaux mots de passe ne sont pas identiques." });
    try {
      await appel("mot-de-passe", "POST", { ancien, nouveau });
      setAncien(""); setNouveau(""); setConfirmation("");
      setMsg({ ok: "Mot de passe changé. Tes autres appareils devront se reconnecter." });
    } catch (err) {
      setMsg({ erreur: (err as Error).message });
    }
  };

  const exporter = async () => {
    const donnees = await appel("export");
    const url = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `carosteo-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <form className="carte pile" onSubmit={changer}>
        <h2>Changer mon mot de passe</h2>
        <p className="discret" style={{ margin: 0 }}>Au moins 10 caractères, avec des lettres et des chiffres. Changer le mot de passe déconnecte tous tes autres appareils (utile en cas de téléphone perdu).</p>
        <div className="grille">
          <Champ label="Mot de passe actuel"><input type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} autoComplete="current-password" required /></Champ>
          <Champ label="Nouveau mot de passe"><input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoComplete="new-password" minLength={10} required /></Champ>
          <Champ label="Confirmer"><input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" minLength={10} required /></Champ>
        </div>
        <Message {...msg} />
        <div><button className="bouton"><KeyRound size={18} />Changer le mot de passe</button></div>
      </form>

      <Import />

      <section className="carte pile">
        <h2>Sauvegarde</h2>
        <p className="discret" style={{ margin: 0 }}>Télécharge tous tes dossiers patients dans un fichier. Garde-le dans un endroit sûr : il contient des données de santé en clair.</p>
        <div><button className="bouton leger" onClick={exporter}><Download size={18} />Exporter mes dossiers</button></div>
      </section>
    </>
  );
}

/** Import d'un fichier de dossiers (reprise des anciennes fiches ou sauvegarde CarOstéo). */
function Import() {
  const [fichier, setFichier] = useState<{ nom: string; dossiers: unknown[]; seances: number } | null>(null);
  const [msg, setMsg] = useState<{ erreur?: string; ok?: string }>({});
  const [envoi, setEnvoi] = useState(false);

  const choisir = async (f: File | undefined) => {
    setMsg({});
    setFichier(null);
    if (!f) return;
    try {
      const contenu = JSON.parse(await f.text());
      const dossiers = Array.isArray(contenu?.dossiers) ? contenu.dossiers : null;
      if (!dossiers?.length) throw new Error();
      const seances = dossiers.reduce((n: number, d: { seances?: unknown[] }) => n + (Array.isArray(d?.seances) ? d.seances.length : 0), 0);
      setFichier({ nom: f.name, dossiers, seances });
    } catch {
      setMsg({ erreur: "Ce fichier n'est pas un fichier de dossiers CarOstéo." });
    }
  };

  const importer = async () => {
    if (!fichier) return;
    setEnvoi(true);
    try {
      const r = await appel<{ importes: number; seances: number; ignores: number; erreurs: string[] }>("import", "POST", { dossiers: fichier.dossiers });
      const details = [
        `${r.importes} dossier${r.importes > 1 ? "s" : ""} et ${r.seances} séance${r.seances > 1 ? "s" : ""} importés.`,
        r.ignores ? `${r.ignores} patient${r.ignores > 1 ? "s" : ""} déjà présent${r.ignores > 1 ? "s" : ""}, ignoré${r.ignores > 1 ? "s" : ""}.` : "",
        r.erreurs.length ? `Problèmes : ${r.erreurs.join(" ; ")}` : "",
      ].filter(Boolean).join(" ");
      setMsg({ ok: details });
      setFichier(null);
    } catch (err) {
      setMsg({ erreur: (err as Error).message });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <section className="carte pile">
      <h2>Importer des dossiers</h2>
      <p className="discret" style={{ margin: 0 }}>Reprise des anciennes fiches ou d'une sauvegarde. Les patients déjà présents (même nom et prénom) ne sont pas importés une deuxième fois.</p>
      <input type="file" accept=".json,application/json" onChange={(e) => choisir(e.target.files?.[0])} />
      {fichier && (
        <div className="ligne">
          <span><b>{fichier.dossiers.length}</b> dossiers et <b>{fichier.seances}</b> séances dans « {fichier.nom} »</span>
          <button className="bouton" onClick={importer} disabled={envoi}><Upload size={18} />{envoi ? "Import en cours…" : "Importer"}</button>
        </div>
      )}
      <Message {...msg} />
    </section>
  );
}

interface CompteResume {
  identifiant: string;
  nom: string;
  cree_le: string;
}

interface Evenement {
  le: string;
  qui: string;
  quoi: string;
}

function Admin() {
  const [comptes, setComptes] = useState<CompteResume[]>([]);
  const [journal, setJournal] = useState<Evenement[]>([]);
  const [identifiant, setIdentifiant] = useState("");
  const [nom, setNom] = useState("");
  const [mdp, setMdp] = useState(proposerMotDePasse);
  const [msg, setMsg] = useState<{ erreur?: string; ok?: string }>({});

  const charger = () => {
    appel<CompteResume[]>("utilisateurs").then(setComptes).catch((e) => setMsg({ erreur: e.message }));
    appel<Evenement[]>("journal").then(setJournal).catch(() => {});
  };
  useEffect(charger, []);

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await appel("utilisateurs", "POST", { identifiant, nom, mot_de_passe: mdp });
      setMsg({ ok: `Compte « ${identifiant} » créé. Transmets-lui son mot de passe : ${mdp}` });
      setIdentifiant(""); setNom(""); setMdp(proposerMotDePasse());
      charger();
    } catch (err) {
      setMsg({ erreur: (err as Error).message });
    }
  };

  const reinitialiser = async (c: CompteResume) => {
    const nouveau = proposerMotDePasse();
    if (!confirm(`Donner un nouveau mot de passe à « ${c.identifiant} » ? Ses appareils seront déconnectés.`)) return;
    try {
      await appel(`utilisateurs/${encodeURIComponent(c.identifiant)}`, "PUT", { mot_de_passe: nouveau });
      setMsg({ ok: `Nouveau mot de passe de « ${c.identifiant} » : ${nouveau}` });
      charger();
    } catch (err) {
      setMsg({ erreur: (err as Error).message });
    }
  };

  const supprimer = async (c: CompteResume) => {
    if (!confirm(`Supprimer « ${c.identifiant} » ET TOUS SES DOSSIERS PATIENTS ? C'est définitif.`)) return;
    if (prompt(`Pour confirmer, tape l'identifiant : ${c.identifiant}`) !== c.identifiant) return;
    try {
      await appel(`utilisateurs/${encodeURIComponent(c.identifiant)}`, "DELETE");
      setMsg({ ok: `Compte « ${c.identifiant} » supprimé.` });
      charger();
    } catch (err) {
      setMsg({ erreur: (err as Error).message });
    }
  };

  return (
    <>
      <p className="discret">Le compte admin gère les accès. Pour protéger le secret médical, il ne voit pas le contenu des dossiers patients.</p>
      <Message {...msg} />

      <form className="carte pile" onSubmit={creer} style={{ marginTop: 16 }}>
        <h2>Créer un compte</h2>
        <div className="grille">
          <Champ label="Identifiant (ex. caroline)"><input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoCapitalize="none" spellCheck={false} required /></Champ>
          <Champ label="Nom affiché"><input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} /></Champ>
          <Champ label="Mot de passe proposé"><input value={mdp} onChange={(e) => setMdp(e.target.value)} minLength={10} required autoComplete="off" /></Champ>
        </div>
        <div><button className="bouton"><UserPlus size={18} />Créer le compte</button></div>
      </form>

      <section className="carte">
        <h2>Comptes</h2>
        {!comptes.length ? <p className="discret">Aucun compte pour l'instant.</p> : (
          <div className="defile">
            <table className="simple">
              <thead><tr><th>Identifiant</th><th>Nom</th><th>Créé le</th><th /></tr></thead>
              <tbody>
                {comptes.map((c) => (
                  <tr key={c.identifiant}>
                    <td><b>{c.identifiant}</b></td>
                    <td>{c.nom}</td>
                    <td>{new Date(c.cree_le).toLocaleDateString("fr-BE")}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="bouton leger petit" onClick={() => reinitialiser(c)}><KeyRound size={15} />Nouveau mot de passe</button>{" "}
                      <button className="bouton danger petit" onClick={() => supprimer(c)} aria-label={`Supprimer ${c.identifiant}`}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="carte">
        <h2>Journal des connexions</h2>
        {!journal.length ? <p className="discret">Rien pour l'instant.</p> : (
          <div className="defile">
            <table className="simple">
              <thead><tr><th>Quand</th><th>Compte</th><th>Événement</th></tr></thead>
              <tbody>
                {journal.slice(0, 100).map((e, i) => (
                  <tr key={i}>
                    <td>{new Date(e.le).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td>{e.qui}</td>
                    <td style={e.quoi.includes("refusée") ? { color: "var(--danger)" } : undefined}>{e.quoi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
