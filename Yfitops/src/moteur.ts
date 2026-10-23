/**
 * Le moteur de lecture : le son vient du lecteur officiel de YouTube (caché, seul le son compte),
 * avec, en secours, l'extrait de 30 s du catalogue quand un titre n'est pas trouvé sur YouTube.
 * Il imite un élément <audio> (play, pause, currentTime, événements) pour le reste de l'app.
 */
import { appel } from "./api";
import type { Titre } from "./types";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let promesseYT: Promise<any> | null = null;
function chargerYT(): Promise<any> {
  return (promesseYT ??= new Promise((ok, ko) => {
    if (window.YT?.Player) return ok(window.YT);
    const ancien = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { ancien?.(); ok(window.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { promesseYT = null; ko(new Error("YouTube injoignable")); };
    document.head.append(s);
  }));
}

const videosConnues = new Map<string, Promise<string[]>>();

/** Les vidéos YouTube d'un titre (la meilleure d'abord). Le serveur garde les réponses. */
export function chercherVideos(t: Titre): Promise<string[]> {
  let p = videosConnues.get(t.id);
  if (!p) {
    p = appel<{ ids?: string[] }>(`youtube?${new URLSearchParams({ id: t.id, titre: t.titre, artiste: t.artiste, duree: String(t.duree) })}`).then((r) => r.ids ?? []);
    p.catch(() => videosConnues.delete(t.id));
    videosConnues.set(t.id, p);
  }
  return p;
}

const EVENEMENTS_AUDIO = ["play", "pause", "ended", "timeupdate", "durationchange", "waiting", "playing", "canplay", "loadedmetadata", "seeked", "error"];

export class Moteur extends EventTarget {
  private audio = new Audio();
  /**
   * Un son silencieux joué dans la page pendant que YouTube joue : ainsi c'est Yfitops (et non la vidéo cachée)
   * que le téléphone, la voiture en Bluetooth ou le casque voient comme lecteur. Leurs boutons précédent/suivant
   * arrivent alors à l'app, avec le titre et l'artiste du catalogue.
   */
  private gardien = Object.assign(new Audio("/silence.mp3"), { loop: true, preload: "auto" });
  private lecteurYT: any = null;
  private pretYT: Promise<any> | null = null;
  private boite: HTMLDivElement | null = null;
  private mode: "aucun" | "youtube" | "audio" = "aucun";
  private jeton = 0;
  private ids: string[] = [];
  private rang = 0;
  private titre: Titre | null = null;
  private minuteur = 0;
  private surveillance = 0;
  private veutJouer = false;
  private niveau = 1;
  idCourant: string | null = null;
  paused = true;
  /** Le navigateur (iPhone) attend un toucher sur la vidéo pour accepter de lancer le son. */
  bloque = false;

  constructor() {
    super();
    this.audio.preload = "auto";
    for (const e of EVENEMENTS_AUDIO) {
      this.audio.addEventListener(e, () => {
        if (this.mode !== "audio") return;
        if (e === "play") this.paused = false;
        if (e === "pause" || e === "ended") this.paused = true;
        this.emettre(e);
      });
    }
  }

  private emettre(e: string) {
    this.dispatchEvent(new Event(e));
  }

  private yt(): Promise<any> {
    return (this.pretYT ??= chargerYT()
      .then((YT) => new Promise((ok) => {
        this.boite = Object.assign(document.createElement("div"), { className: "lecteur-youtube" });
        const zone = document.createElement("div");
        const aide = Object.assign(document.createElement("p"), { textContent: "Touche la vidéo pour lancer le son. Ensuite, la lecture s'enchaînera toute seule." });
        const annuler = Object.assign(document.createElement("button"), { textContent: "Annuler", className: "bouton-contour" });
        annuler.onclick = () => this.pause();
        this.boite.append(zone, aide, annuler);
        document.body.append(this.boite);
        this.lecteurYT = new YT.Player(zone, {
          width: 200, height: 200,
          playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, fs: 0, iv_load_policy: 3, origin: location.origin },
          events: {
            onReady: () => { this.lecteurYT.setVolume(this.niveau * 100); ok(this.lecteurYT); },
            onStateChange: (e: any) => this.etatYT(e.data),
            onError: () => this.erreurYT(),
          },
        });
      }))
      .catch((e) => { this.pretYT = null; throw e; }));
  }

  private debloquer(oui: boolean) {
    if (this.bloque === oui) return;
    this.bloque = oui;
    this.boite?.classList.toggle("visible", oui);
    this.emettre("bloque");
  }

  private etatYT(etat: number) {
    if (this.mode !== "youtube") return;
    if (etat === 1) {
      clearTimeout(this.surveillance);
      this.debloquer(false);
      this.garder(true);
      this.paused = false;
      this.emettre("play");
      this.emettre("playing");
      this.emettre("durationchange");
      this.suivreTemps(true);
    } else if (etat === 2) {
      this.paused = true;
      this.suivreTemps(false);
      this.emettre("pause");
    } else if (etat === 3) {
      this.emettre("waiting");
    } else if (etat === 0) {
      this.paused = true;
      this.suivreTemps(false);
      this.emettre("pause");
      this.emettre("ended");
    } else if (etat === 5) {
      this.emettre("durationchange");
      this.emettre("canplay");
    }
  }

  /** Vidéo illisible ici (retirée, intégration refusée…) : la suivante, sinon l'extrait. */
  private erreurYT() {
    if (this.mode !== "youtube") return;
    if (this.rang + 1 < this.ids.length) {
      this.rang++;
      this.lancerVideo(0);
    } else {
      this.lancerApercu(0);
    }
  }

  /** Lance (ou relance, pour redevenir le lecteur le plus récent) le son silencieux, ou l'arrête. */
  private garder(oui: boolean) {
    if (!oui) return this.gardien.pause();
    this.gardien.pause();
    this.gardien.play().catch(() => {});
  }

  private suivreTemps(oui: boolean) {
    clearInterval(this.minuteur);
    if (oui) this.minuteur = window.setInterval(() => this.emettre("timeupdate"), 250);
  }

  /** Si la vidéo ne démarre pas toute seule (iPhone), on demande un toucher. */
  private surveiller() {
    clearTimeout(this.surveillance);
    this.surveillance = window.setTimeout(() => {
      const etat = this.lecteurYT?.getPlayerState?.();
      if (this.mode === "youtube" && this.veutJouer && (etat === -1 || etat === 5)) {
        this.debloquer(true);
        this.emettre("canplay");
        this.emettre("pause");
      }
    }, 2500);
  }

  get currentTime(): number {
    if (this.mode === "youtube") return this.lecteurYT?.getCurrentTime?.() ?? 0;
    return this.mode === "audio" ? this.audio.currentTime : 0;
  }

  set currentTime(s: number) {
    if (this.mode === "youtube") {
      this.lecteurYT?.seekTo?.(s, true);
      this.emettre("timeupdate");
      this.emettre("seeked");
    } else if (this.mode === "audio") {
      this.audio.currentTime = s;
    }
  }

  get duration(): number {
    if (this.mode === "youtube") return this.lecteurYT?.getDuration?.() || this.titre?.duree || 0;
    return this.mode === "audio" ? this.audio.duration : 0;
  }

  set volume(v: number) {
    this.niveau = v;
    this.audio.volume = v;
    this.lecteurYT?.setVolume?.(v * 100);
  }

  async charger(t: Titre, { depart = 0, jouer = false } = {}) {
    const jeton = ++this.jeton;
    this.arreter();
    this.titre = t;
    this.idCourant = t.id;
    this.veutJouer = jouer;
    this.emettre("emptied");
    if (jouer) this.emettre("waiting");
    const ids = await chercherVideos(t).catch(() => [] as string[]);
    if (jeton !== this.jeton) return;
    if (ids.length) {
      try {
        await this.yt();
        if (jeton !== this.jeton) return;
        this.mode = "youtube";
        this.ids = ids;
        this.rang = 0;
        this.lancerVideo(depart);
        return;
      } catch {
        // YouTube injoignable : extrait
      }
    }
    this.lancerApercu(depart);
  }

  private lancerVideo(depart: number) {
    const options = { videoId: this.ids[this.rang], startSeconds: Math.floor(depart) };
    if (this.veutJouer) {
      this.lecteurYT.loadVideoById(options);
      this.surveiller();
    } else {
      this.lecteurYT.cueVideoById(options);
    }
  }

  private lancerApercu(depart: number) {
    this.debloquer(false);
    this.garder(false); // l'extrait est lu dans la page : il sert lui-même de lecteur
    if (!this.titre?.apercu) {
      this.mode = "aucun";
      this.emettre("error");
      return;
    }
    this.mode = "audio";
    this.emettre("apercu");
    this.audio.src = this.titre.apercu;
    if (depart > 0 && depart < 30) this.audio.addEventListener("loadedmetadata", () => { this.audio.currentTime = depart; }, { once: true });
    if (this.veutJouer) this.audio.play().catch(() => {});
  }

  play(): Promise<void> {
    this.veutJouer = true;
    if (this.mode === "youtube") {
      this.garder(true); // pendant le toucher : le téléphone l'autorise ensuite pour la suite
      this.lecteurYT?.playVideo?.();
      this.surveiller();
      return Promise.resolve();
    }
    if (this.mode === "audio") return this.audio.play();
    return Promise.resolve(); // encore en chargement : démarrera tout seul
  }

  pause() {
    this.veutJouer = false;
    this.garder(false);
    clearTimeout(this.surveillance);
    this.debloquer(false);
    if (this.mode === "youtube") this.lecteurYT?.pauseVideo?.();
    if (this.mode === "audio") this.audio.pause();
    if (this.mode === "aucun" && !this.paused) {
      this.paused = true;
      this.emettre("pause");
    }
  }

  private arreter() {
    clearTimeout(this.surveillance);
    this.suivreTemps(false);
    const ancien = this.mode;
    this.mode = "aucun";
    if (ancien === "youtube") this.lecteurYT?.stopVideo?.();
    if (ancien === "audio") {
      this.audio.pause();
      this.audio.removeAttribute("src");
    }
    if (!this.paused) {
      this.paused = true;
      this.emettre("pause");
    }
  }

  vider() {
    this.jeton++;
    this.garder(false);
    this.arreter();
    this.debloquer(false);
    this.idCourant = null;
    this.titre = null;
    this.emettre("emptied");
  }
}
