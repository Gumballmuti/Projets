import { getData } from "./store";

/** Vibration légère si le joueur l'a activée et si l'appareil la supporte (pas sur iPhone). */
export function vibrate(pattern: number | number[] = 30) {
  try {
    if (!getData().profil.preferences.vibrations) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* sans importance */
  }
}
