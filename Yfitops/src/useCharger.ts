import { useCallback, useEffect, useState } from "react";

/** Charge des données du catalogue, avec l'état de chargement et d'erreur. */
export function useCharger<T>(f: () => Promise<T>, deps: unknown[]) {
  const [etat, setEtat] = useState<{ donnees?: T; erreur?: Error; chargement: boolean }>({ chargement: true });
  const [essai, setEssai] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const charger = useCallback(f, deps);
  useEffect(() => {
    let actif = true;
    setEtat((e) => ({ donnees: e.donnees, chargement: true }));
    charger()
      .then((donnees) => actif && setEtat({ donnees, chargement: false }))
      .catch((erreur) => actif && setEtat({ erreur, chargement: false }));
    return () => { actif = false; };
  }, [charger, essai]);
  return { ...etat, recharger: () => setEssai((n) => n + 1) };
}
