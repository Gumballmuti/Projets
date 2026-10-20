import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useLocation } from "react-router-dom";

type Panneau = "enCours" | "file" | null;

function useValeur(vue: RefObject<HTMLElement | null>) {
  const [panneau, setPanneau] = useState<Panneau>(() => (localStorage.getItem("musique.panneau") as Panneau) || null);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [defilement, setDefilement] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    try { localStorage.setItem("musique.panneau", panneau ?? ""); } catch {}
  }, [panneau]);

  // Chaque page s'ouvre en haut
  useEffect(() => {
    vue.current?.scrollTo(0, 0);
    setDefilement(0);
  }, [pathname, vue]);

  useEffect(() => {
    const el = vue.current;
    if (!el) return;
    let image = 0;
    const surDefilement = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(() => setDefilement(el.scrollTop));
    };
    el.addEventListener("scroll", surDefilement, { passive: true });
    return () => el.removeEventListener("scroll", surDefilement);
  }, [vue]);

  return {
    panneau, pleinEcran, defilement, setPleinEcran,
    basculerPanneau: (p: Exclude<Panneau, null>) => setPanneau((x) => (x === p ? null : p)),
    fermerPanneau: () => setPanneau(null),
  };
}

const Ctx = createContext<ReturnType<typeof useValeur>>(null!);

export function FournisseurInterface({ children }: { children: (vue: RefObject<HTMLElement | null>) => ReactNode }) {
  const vue = useRef<HTMLElement>(null);
  return <Ctx.Provider value={useValeur(vue)}>{children(vue)}</Ctx.Provider>;
}

export const useInterface = () => useContext(Ctx);
