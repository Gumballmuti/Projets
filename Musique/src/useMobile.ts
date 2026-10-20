import { useSyncExternalStore } from "react";

const requete = matchMedia("(max-width: 767px)");

/** Vrai sur un écran de téléphone (mise en page mobile). */
export function useMobile() {
  return useSyncExternalStore(
    (f) => { requete.addEventListener("change", f); return () => requete.removeEventListener("change", f); },
    () => requete.matches,
  );
}
