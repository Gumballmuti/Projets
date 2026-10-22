import { ChevronLeft, ChevronRight } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Pochette from "../composants/Pochette";
import { useMobile } from "../useMobile";

export interface ElementMenu {
  libelle: string;
  icone?: ReactNode;
  action?: () => void;
  sousMenu?: () => ElementMenu[];
  recherche?: boolean; // le sous-menu a un champ pour filtrer (choix d'une playlist)
  danger?: boolean;
  separateur?: boolean;
}

interface Ouvert {
  x: number;
  y: number;
  elements: ElementMenu[];
  entete?: { image: string; nom: string; sous: string; rond?: boolean };
}

type Ouvrir = (ou: { clientX: number; clientY: number } | HTMLElement, elements: ElementMenu[], entete?: Ouvert["entete"]) => void;
const Ctx = createContext<Ouvrir>(() => {});

/** Menus contextuels (clic droit, bouton « … »). Sur téléphone : un volet qui monte du bas. */
export function FournisseurMenu({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState<Ouvert | null>(null);
  const ouvrir = useCallback<Ouvrir>((ou, elements, entete) => {
    const p = ou instanceof HTMLElement ? ou.getBoundingClientRect() : null;
    setOuvert({ x: p ? p.left : (ou as MouseEvent).clientX, y: p ? p.bottom + 4 : (ou as MouseEvent).clientY, elements, entete });
  }, []);
  return (
    <Ctx.Provider value={ouvrir}>
      {children}
      {ouvert && <Menu {...ouvert} fermer={() => setOuvert(null)} />}
    </Ctx.Provider>
  );
}

function Menu({ x, y, elements, entete, fermer }: Ouvert & { fermer: () => void }) {
  const [pile, setPile] = useState<{ elements: ElementMenu[]; recherche?: boolean }[]>([{ elements }]);
  const [filtre, setFiltre] = useState("");
  const boite = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const mobile = useMobile();
  const niveau = pile[pile.length - 1];

  useLayoutEffect(() => {
    const b = boite.current;
    if (!b || mobile) return;
    const { width, height } = b.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(x, innerWidth - width - 8)), top: Math.max(8, Math.min(y, innerHeight - height - 8)) });
  }, [x, y, pile, mobile]);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    addEventListener("keydown", touche);
    addEventListener("resize", fermer);
    return () => {
      removeEventListener("keydown", touche);
      removeEventListener("resize", fermer);
    };
  }, [fermer]);

  const visibles = niveau.recherche && filtre
    ? niveau.elements.filter((e) => e.separateur || e.libelle.toLowerCase().includes(filtre.toLowerCase()))
    : niveau.elements;

  return (
    <div className="menu-fond" onClick={fermer} onContextMenu={(e) => { e.preventDefault(); fermer(); }}>
      <div ref={boite} className={"menu" + (mobile ? " menu-volet" : "")} style={mobile ? undefined : pos}
        role="menu" onClick={(e) => e.stopPropagation()}>
        {mobile && entete && pile.length === 1 && (
          <div className="menu-entete">
            <Pochette src={entete.image} taille={52} rond={entete.rond} />
            <div><b>{entete.nom}</b><span>{entete.sous}</span></div>
          </div>
        )}
        {pile.length > 1 && (
          <button className="menu-element" onClick={() => { setPile((p) => p.slice(0, -1)); setFiltre(""); }}>
            <ChevronLeft size={18} /> Retour
          </button>
        )}
        {niveau.recherche && (
          <input className="menu-recherche" placeholder="Rechercher une playlist" value={filtre} autoFocus={!mobile}
            onChange={(e) => setFiltre(e.target.value)} />
        )}
        {visibles.map((e, i) => e.separateur ? <hr key={i} /> : (
          <button key={i} role="menuitem" className={"menu-element" + (e.danger ? " danger" : "")} onClick={() => {
            if (e.sousMenu) {
              setPile((p) => [...p, { elements: e.sousMenu!(), recherche: e.recherche }]);
              setFiltre("");
            } else {
              fermer();
              e.action?.();
            }
          }}>
            {e.icone}
            <span>{e.libelle}</span>
            {e.sousMenu && <ChevronRight size={16} className="menu-fleche" />}
          </button>
        ))}
        {mobile && <button className="menu-fermer" onClick={fermer}>Fermer</button>}
      </div>
    </div>
  );
}

export const useMenu = () => useContext(Ctx);
