import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";
import { useLecteur, useTemps } from "../etat/Lecteur";
import { duree } from "../outils";
import Curseur from "./Curseur";

/** Aléatoire, précédent, lecture, suivant, répéter. */
export function Commandes({ grand = false }: { grand?: boolean }) {
  const l = useLecteur();
  const t = grand ? 28 : 16;
  const repeter = l.repetition === "non" ? "Activer la répétition" : l.repetition === "tout" ? "Répéter le titre" : "Désactiver la répétition";
  return (
    <div className={"commandes" + (grand ? " grand" : "")}>
      <button className={"icone" + (l.aleatoire ? " actif" : "")} aria-pressed={l.aleatoire}
        title={l.aleatoire ? "Désactiver la lecture aléatoire" : "Activer la lecture aléatoire"} onClick={l.basculerAleatoire}>
        <Shuffle size={t} />
      </button>
      <button className="icone" title="Précédent" aria-label="Précédent" onClick={l.precedent}><SkipBack size={t} fill="currentColor" /></button>
      <button className="bouton-pause" title={l.enLecture ? "Pause" : "Lecture"} aria-label={l.enLecture ? "Pause" : "Lecture"}
        onClick={l.basculerLecture} disabled={!l.enCours}>
        {l.chargement && l.enLecture ? <span className="rond-chargement" /> : l.enLecture
          ? <Pause size={grand ? 28 : 16} fill="currentColor" strokeWidth={0} />
          : <Play size={grand ? 28 : 16} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />}
      </button>
      <button className="icone" title="Suivant" aria-label="Suivant" onClick={l.suivant}><SkipForward size={t} fill="currentColor" /></button>
      <button className={"icone" + (l.repetition !== "non" ? " actif" : "")} title={repeter} aria-label={repeter} onClick={l.basculerRepetition}>
        {l.repetition === "un" ? <Repeat1 size={t} /> : <Repeat size={t} />}
      </button>
    </div>
  );
}

export function Progression() {
  const l = useLecteur();
  const { temps, duree: d } = useTemps();
  const total = d || l.enCours?.duree || 0;
  const [apercu, setApercu] = useState<number | null>(null);
  return (
    <div className="progression">
      <span className="temps">{duree(apercu ?? temps)}</span>
      <Curseur libelle="Position dans le titre" valeur={temps} max={total} onValider={l.aller} onDeplacer={setApercu} />
      <span className="temps">{duree(total)}</span>
    </div>
  );
}
