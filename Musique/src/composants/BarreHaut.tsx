import { ChevronLeft, ChevronRight, Home, LogOut, Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { appel } from "../api";
import { useSession } from "../etat/Session";
import Logo from "./Logo";

/** En haut, sur ordinateur : flèches, accueil, champ de recherche, compte. */
export default function BarreHaut() {
  const aller = useNavigate();
  const { pathname } = useLocation();
  const { moi, deconnecte } = useSession();
  const [menu, setMenu] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const q = pathname.startsWith("/recherche/") ? decodeURIComponent(pathname.slice(11)) : "";
  const [texte, setTexte] = useState(q);
  const minuteur = useRef<number>(undefined);

  useEffect(() => setTexte(q), [q]);
  useEffect(() => {
    // Ctrl/Cmd + K : aller à la recherche
    const touche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); champ.current?.focus(); }
    };
    addEventListener("keydown", touche);
    return () => removeEventListener("keydown", touche);
  }, []);

  const chercher = (v: string) => {
    setTexte(v);
    clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => {
      aller(v.trim() ? `/recherche/${encodeURIComponent(v.trim())}` : "/recherche", { replace: pathname.startsWith("/recherche") });
    }, 300);
  };

  return (
    <div className="barre-haut">
      <div className="barre-haut-gauche">
        <Link to="/" className="logo-lien" aria-label="Ma musique"><Logo taille={32} /></Link>
        <button className="icone rond sombre" aria-label="Revenir en arrière" onClick={() => aller(-1)}><ChevronLeft size={20} /></button>
        <button className="icone rond sombre" aria-label="Avancer" onClick={() => aller(1)}><ChevronRight size={20} /></button>
      </div>
      <div className="barre-haut-centre">
        <NavLink to="/" end className="icone rond accueil" title="Accueil" aria-label="Accueil"><Home size={24} /></NavLink>
        <label className="champ-recherche">
          <Search size={22} />
          <input ref={champ} placeholder="Que souhaitez-vous écouter ?" value={texte}
            onChange={(e) => chercher(e.target.value)} onFocus={() => !pathname.startsWith("/recherche") && aller("/recherche")} />
          {texte && <button className="icone" aria-label="Effacer" onClick={() => chercher("")}><X size={20} /></button>}
        </label>
      </div>
      <div className="barre-haut-droite">
        <button className="avatar" title={moi.identifiant} aria-label="Mon compte" onClick={() => setMenu(!menu)}>
          {moi.identifiant[0]?.toUpperCase()}
        </button>
        {menu && (
          <div className="menu-fond" onClick={() => setMenu(false)}>
            <div className="menu menu-compte" onClick={(e) => e.stopPropagation()}>
              <button className="menu-element" onClick={() => { setMenu(false); aller("/compte"); }}><User size={18} /> <span>Compte</span></button>
              <hr />
              <button className="menu-element" onClick={async () => { await appel("deconnexion", "POST").catch(() => {}); deconnecte(); }}>
                <LogOut size={18} /> <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
