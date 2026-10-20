import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { appel } from "../api";
import Logo from "../composants/Logo";

export default function Connexion({ onConnecte }: { onConnecte: () => void }) {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      await appel("connexion", "POST", { identifiant: identifiant.trim(), mot_de_passe: motDePasse });
      onConnecte();
    } catch {
      setErreur("Identifiant ou mot de passe incorrect");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="connexion">
      <form className="connexion-carte" onSubmit={envoyer}>
        <Logo taille={44} />
        <h1>Se connecter à Ma musique</h1>
        {erreur && <p className="connexion-erreur" role="alert">{erreur}</p>}
        <label htmlFor="identifiant">Identifiant</label>
        <input id="identifiant" autoFocus autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="Identifiant" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} />
        <label htmlFor="mdp">Mot de passe</label>
        <div className="champ-mdp">
          <input id="mdp" type={voir ? "text" : "password"} autoComplete="current-password" autoCapitalize="none" autoCorrect="off"
            spellCheck={false} placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
          <button type="button" className="icone" aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setVoir(!voir)}>{voir ? <EyeOff size={20} /> : <Eye size={20} />}</button>
        </div>
        <button className="bouton-vert large" disabled={envoi || !motDePasse}>Se connecter</button>
        <p className="doux connexion-aide">Pas de compte ? Demande à l'administrateur de t'en créer un.</p>
      </form>
    </div>
  );
}
