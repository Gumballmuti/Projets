import { WifiOff } from "lucide-react";

export function Erreur({ onReessayer, texte = "Impossible de joindre le catalogue de musique." }: { onReessayer?: () => void; texte?: string }) {
  return (
    <div className="etat-erreur">
      <WifiOff size={40} />
      <b>{texte}</b>
      <p className="doux">Vérifie ta connexion à Internet, puis réessaie.</p>
      {onReessayer && <button className="bouton-blanc" onClick={onReessayer}>Réessayer</button>}
    </div>
  );
}

export function CartesFantomes({ n = 6 }: { n?: number }) {
  return <>{Array.from({ length: n }, (_, i) => <div key={i} className="carte fantome"><div className="carte-image" /><div className="ligne-f" /><div className="ligne-f courte" /></div>)}</>;
}

export function LignesFantomes({ n = 8 }: { n?: number }) {
  return <div className="liste-titres">{Array.from({ length: n }, (_, i) => <div key={i} className="ligne-titre fantome"><span /><span className="ligne-f" /></div>)}</div>;
}
