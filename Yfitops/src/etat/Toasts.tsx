import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const Ctx = createContext<(message: string) => void>(() => {});

/** Petits messages en bas de l'écran (« Ajouté aux titres likés »…). */
export function FournisseurToasts({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ texte: string; n: number } | null>(null);
  const minuteur = useRef<number>(undefined);
  const afficher = useCallback((texte: string) => {
    setMessage((m) => ({ texte, n: (m?.n ?? 0) + 1 }));
    clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => setMessage(null), 3000);
  }, []);
  return (
    <Ctx.Provider value={afficher}>
      {children}
      {message && <div className="toast" key={message.n} role="status">{message.texte}</div>}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
