import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { appel, NonConnecte } from "../api";
import Connexion from "../pages/Connexion";

export interface Moi {
  identifiant: string;
  admin: boolean;
}

const Ctx = createContext<{ moi: Moi; deconnecte: () => void }>(null!);

/** N'affiche l'app qu'une fois connecté ; sinon, la page de connexion. */
export function FournisseurSession({ children }: { children: ReactNode }) {
  const [moi, setMoi] = useState<Moi | null | undefined>(undefined);
  const aller = useNavigate();
  const charger = useCallback(() => {
    appel<Moi>("moi").then(setMoi).catch((e) => setMoi(e instanceof NonConnecte ? null : undefined));
  }, []);
  useEffect(charger, [charger]);
  if (moi === undefined) return <div className="demarrage" aria-label="Chargement" />;
  if (moi === null) return <Connexion onConnecte={charger} />;
  return <Ctx.Provider value={{ moi, deconnecte: () => { setMoi(null); aller("/", { replace: true }); } }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
