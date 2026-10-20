import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { chercherVideos, Moteur } from "../moteur";
import { ecrire, lire, melanger } from "../outils";
import type { Contexte, Titre } from "../types";
import { useBiblio } from "./Bibliotheque";
import { useToast } from "./Toasts";

export type Repetition = "non" | "tout" | "un";

interface Etat {
  liste: Titre[]; // les titres du contexte (playlist, artiste…), dans leur ordre
  ordre: number[]; // ordre de lecture (mélangé ou non) : indices dans liste
  position: number; // où on en est dans ordre
  file: Titre[]; // « File d'attente » : ajoutés à la main, passent avant la suite
  enCours: Titre | null;
  depuisFile: boolean;
  contexte: Contexte | null;
  aleatoire: boolean;
  repetition: Repetition;
  lancement: number; // change à chaque nouveau titre lancé
}

const CLE = "musique.lecteur";
const initial: Etat = {
  liste: [], ordre: [], position: 0, file: [], enCours: null, depuisFile: false,
  contexte: null, aleatoire: false, repetition: "non", lancement: 0,
};
const suite = (n: number) => Array.from({ length: n }, (_, i) => i);
const TYPES_RECENTS = ["maPlaylist", "playlist", "artiste", "aimes", "genre"];

function useValeur() {
  const audio = useMemo(() => new Moteur(), []);
  const [etat, setEtat] = useState<Etat>(() => ({ ...initial, ...lire<Partial<Etat>>(CLE, {}), lancement: 0 }));
  const ref = useRef(etat);
  ref.current = etat;
  const veutJouer = useRef(false);
  const erreurs = useRef(0);
  const [enLecture, setEnLecture] = useState(false);
  const [chargement, setChargement] = useState(false);
  const chargementRef = useRef(false);
  chargementRef.current = chargement;
  const [volume, setVolume] = useState(() => lire("musique.volume", 0.8));
  const [muet, setMuet] = useState(false);
  const toast = useToast();
  const biblio = useBiblio();
  const ajouterRecent = useRef(biblio.ajouterRecent);
  ajouterRecent.current = biblio.ajouterRecent;

  const maj = useCallback((f: (s: Etat) => Etat) => {
    ref.current = f(ref.current);
    setEtat(ref.current);
  }, []);

  // Un nouveau titre : on charge le son (et on reprend où on en était au démarrage de l'app)
  useEffect(() => {
    const t = etat.enCours;
    if (!t) {
      audio.vider();
      return;
    }
    if (audio.idCourant !== t.id) {
      audio.charger(t, { depart: etat.lancement === 0 ? lire("musique.temps", 0) : 0, jouer: veutJouer.current });
    } else if (etat.lancement > 0) {
      audio.currentTime = 0;
      if (veutJouer.current) audio.play().catch(() => {});
    }
    // Le titre suivant est cherché à l'avance, pour enchaîner sans attendre
    const s = ref.current;
    const prochain = s.file[0] ?? s.liste[s.ordre[s.position + 1]];
    const m = prochain ? window.setTimeout(() => chercherVideos(prochain).catch(() => {}), 4000) : 0;
    return () => clearTimeout(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.lancement, etat.enCours?.id]);

  useEffect(() => ecrire(CLE, etat), [etat]);
  useEffect(() => () => audio.pause(), [audio]); // déconnexion : on coupe le son
  useEffect(() => {
    audio.volume = muet ? 0 : volume;
    ecrire("musique.volume", volume);
  }, [audio, volume, muet]);

  const lancer = (s: Etat, changements: Partial<Etat>): Etat => {
    veutJouer.current = true;
    return { ...s, ...changements, lancement: s.lancement + 1 };
  };

  const suivant = useCallback((auto = false) => {
    const s = ref.current;
    if (auto && s.repetition === "un") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    if (s.file.length) {
      const [t, ...reste] = s.file;
      return maj((x) => lancer(x, { file: reste, enCours: t, depuisFile: true }));
    }
    if (!s.ordre.length) return;
    let position = s.position + 1;
    let ordre = s.ordre;
    if (position >= ordre.length) {
      if (s.repetition !== "tout") {
        // Fin de la liste : on revient au début, en pause
        veutJouer.current = false;
        audio.pause();
        return maj((x) => ({ ...x, position: 0, enCours: x.liste[x.ordre[0]], depuisFile: false, lancement: x.lancement + 1 }));
      }
      position = 0;
      if (s.aleatoire) ordre = melanger(ordre);
    }
    maj((x) => lancer(x, { ordre, position, enCours: x.liste[ordre[position]], depuisFile: false }));
  }, [audio, maj]);

  const precedent = useCallback(() => {
    const s = ref.current;
    if (audio.currentTime > 3 || (!s.depuisFile && s.position === 0)) {
      audio.currentTime = 0;
      return;
    }
    const position = s.depuisFile ? s.position : s.position - 1;
    maj((x) => lancer(x, { position, enCours: x.liste[x.ordre[position]] ?? x.enCours, depuisFile: false }));
  }, [audio, maj]);

  // Événements du son
  useEffect(() => {
    const jouer = () => { setEnLecture(true); erreurs.current = 0; };
    const pause = () => setEnLecture(false);
    const fin = () => suivant(true);
    const attente = () => setChargement(true);
    const pret = () => setChargement(false);
    const apercu = () => toast("Titre introuvable sur YouTube : extrait de 30 s");
    const erreur = () => {
      setChargement(false);
      erreurs.current++;
      toast("Ce titre n'est pas disponible pour le moment");
      if (erreurs.current < 5 && veutJouer.current) setTimeout(() => suivant(true), 800);
    };
    let dernier = 0;
    const temps = () => {
      if (Math.abs(audio.currentTime - dernier) > 5) {
        dernier = audio.currentTime;
        ecrire("musique.temps", Math.floor(audio.currentTime));
      }
    };
    const evenements: [string, () => void][] = [
      ["play", jouer], ["pause", pause], ["ended", fin], ["waiting", attente], ["playing", pret],
      ["canplay", pret], ["error", erreur], ["timeupdate", temps], ["apercu", apercu], ["emptied", pret],
    ];
    evenements.forEach(([e, f]) => audio.addEventListener(e, f));
    return () => evenements.forEach(([e, f]) => audio.removeEventListener(e, f));
  }, [audio, suivant, toast]);

  const basculerLecture = useCallback(() => {
    if (!ref.current.enCours) return;
    if (!veutJouer.current || audio.paused && !chargementRef.current) {
      veutJouer.current = true;
      audio.play().catch(() => toast("Lecture impossible"));
    } else {
      veutJouer.current = false;
      audio.pause();
    }
  }, [audio, toast]);

  const jouer = useCallback((liste: Titre[], depart = 0, contexte: Contexte | null = null, options: { aleatoire?: boolean } = {}) => {
    if (!liste.length) return;
    const aleatoire = options.aleatoire ?? ref.current.aleatoire;
    if (depart < 0) depart = aleatoire ? Math.floor(Math.random() * liste.length) : 0;
    const autres = suite(liste.length).filter((i) => i !== depart);
    const ordre = aleatoire ? [depart, ...melanger(autres)] : suite(liste.length);
    maj((x) => lancer(x, {
      liste, ordre, position: aleatoire ? 0 : depart, enCours: liste[depart], depuisFile: false, contexte, aleatoire,
    }));
    if (contexte && TYPES_RECENTS.includes(contexte.type)) {
      ajouterRecent.current({
        type: contexte.type as any, id: contexte.id, nom: contexte.nom,
        image: contexte.image ?? liste[0].image, sous_titre: contexte.sous_titre ?? "",
      });
    }
  }, [maj]);

  const basculerAleatoire = useCallback(() => maj((s) => {
    const aleatoire = !s.aleatoire;
    if (!s.liste.length) return { ...s, aleatoire };
    const actuel = s.ordre[s.position] ?? 0;
    return aleatoire
      ? { ...s, aleatoire, ordre: [actuel, ...melanger(suite(s.liste.length).filter((i) => i !== actuel))], position: 0 }
      : { ...s, aleatoire, ordre: suite(s.liste.length), position: actuel };
  }), [maj]);

  const valeur = useMemo(() => {
    const aSuivre = etat.ordre.slice(etat.position + 1).map((i) => etat.liste[i]).filter(Boolean);
    return {
      audio, ...etat, enLecture, chargement, volume, muet, aSuivre,
      jouer, suivant: () => suivant(false), precedent, basculerLecture, basculerAleatoire,
      basculerRepetition: () => maj((s) => ({ ...s, repetition: s.repetition === "non" ? "tout" : s.repetition === "tout" ? "un" : "non" })),
      aller: (secondes: number) => { audio.currentTime = secondes; ecrire("musique.temps", Math.floor(secondes)); },
      changerVolume: (v: number) => { setVolume(v); setMuet(false); },
      basculerMuet: () => setMuet((m) => !m),
      /** Le bouton lecture d'une playlist : pause si c'est déjà elle qui joue. */
      jouerContexte(liste: Titre[], contexte: Contexte, options: { aleatoire?: boolean } = {}) {
        if (etat.contexte?.id === contexte.id && etat.contexte.type === contexte.type && etat.enCours && options.aleatoire === undefined) {
          return basculerLecture();
        }
        jouer(liste, -1, contexte, options);
      },
      joueContexte: (type: string, id: string) => enLecture && etat.contexte?.type === type && etat.contexte.id === id,
      ajouterFile(titres: Titre[]) {
        maj((s) => ({ ...s, file: [...s.file, ...titres] }));
        toast(titres.length > 1 ? `${titres.length} titres ajoutés à la file d'attente` : "Ajouté à la file d'attente");
        if (!ref.current.enCours) suivant(false);
      },
      retirerFile: (i: number) => maj((s) => ({ ...s, file: s.file.filter((_, j) => j !== i) })),
      viderFile: () => maj((s) => ({ ...s, file: [] })),
      jouerDepuisFile: (i: number) => maj((s) => lancer(s, { enCours: s.file[i], file: s.file.slice(i + 1), depuisFile: true })),
      jouerDepuisSuite: (i: number) => {
        const position = etat.position + 1 + i;
        maj((s) => lancer(s, { position, enCours: s.liste[s.ordre[position]], depuisFile: false }));
      },
    };
  }, [etat, enLecture, chargement, volume, muet, audio, jouer, suivant, precedent, basculerLecture, basculerAleatoire, maj, toast]);

  // Écran verrouillé, casque Bluetooth, touches multimédia
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const t = etat.enCours;
    navigator.mediaSession.metadata = t
      ? new MediaMetadata({ title: t.titre, artist: t.artiste, album: etat.contexte?.nom ?? "", artwork: t.image ? [{ src: t.image, sizes: "480x480" }] : [] })
      : null;
    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => basculerLecture()], ["pause", () => basculerLecture()],
      ["previoustrack", () => precedent()], ["nexttrack", () => suivant(false)],
      ["seekto", (d) => { if (d.seekTime !== undefined) audio.currentTime = d.seekTime; }],
    ];
    for (const [a, f] of actions) try { navigator.mediaSession.setActionHandler(a, f); } catch {}
  }, [etat.enCours, etat.contexte, audio, basculerLecture, precedent, suivant]);

  useEffect(() => {
    const t = etat.enCours;
    document.title = t && enLecture ? `${t.titre} • ${t.artiste}` : "Yfitops";
  }, [etat.enCours, enLecture]);

  return valeur;
}

const Ctx = createContext<ReturnType<typeof useValeur>>(null!);
const CtxTemps = createContext({ temps: 0, duree: 0 });

export function FournisseurLecteur({ children }: { children: ReactNode }) {
  const valeur = useValeur();
  return (
    <Ctx.Provider value={valeur}>
      <Temps audio={valeur.audio}>{children}</Temps>
    </Ctx.Provider>
  );
}

/** La position dans le titre change plusieurs fois par seconde : contexte à part, pour ne pas tout redessiner. */
function Temps({ audio, children }: { audio: Moteur; children: ReactNode }) {
  const [t, setT] = useState({ temps: 0, duree: 0 });
  useEffect(() => {
    const maj = () => setT({ temps: audio.currentTime || 0, duree: Number.isFinite(audio.duration) ? audio.duration : 0 });
    const evenements = ["timeupdate", "durationchange", "loadedmetadata", "seeked", "emptied"];
    evenements.forEach((e) => audio.addEventListener(e, maj));
    return () => evenements.forEach((e) => audio.removeEventListener(e, maj));
  }, [audio]);
  return <CtxTemps.Provider value={t}>{children}</CtxTemps.Provider>;
}

export const useLecteur = () => useContext(Ctx);
export const useTemps = () => useContext(CtxTemps);
