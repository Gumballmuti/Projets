import { useState, type FormEvent } from "react";
import { appel } from "../api";
import { Champ, Message } from "../composants/Champs";

export default function Connexion({ connecte }: { connecte: () => void }) {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await appel("connexion", "POST", { identifiant, mot_de_passe: motDePasse });
      setMotDePasse("");
      connecte();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="connexion">
      <div className="connexion-visuel" role="img" aria-label="CE — Caroline Espartero Alonso, ostéopathe" />
      <div className="connexion-cote">
        <form className="connexion-carte pile" onSubmit={envoyer}>
          <div className="connexion-marque">
            <div className="nom-app">Car<span>Ostéo</span></div>
            <p className="discret">Dossiers patients</p>
          </div>
          <Champ label="Identifiant">
            <input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)}
              autoComplete="username" autoCapitalize="none" spellCheck={false} required />
          </Champ>
          <Champ label="Mot de passe">
            <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete="current-password" required />
          </Champ>
          <Message erreur={erreur} />
          <button className="bouton" disabled={envoi}>{envoi ? "Connexion…" : "Se connecter"}</button>
        </form>
      </div>
    </div>
  );
}
