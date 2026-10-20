import { Pause, Play } from "lucide-react";

export default function BoutonLecture({ enLecture, onClick, taille = 56, className = "" }:
  { enLecture: boolean; onClick: () => void; taille?: number; className?: string }) {
  return (
    <button className={"bouton-lecture " + className} style={{ width: taille, height: taille }}
      aria-label={enLecture ? "Pause" : "Lecture"}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}>
      {enLecture ? <Pause size={taille * 0.42} fill="currentColor" strokeWidth={0} />
        : <Play size={taille * 0.42} fill="currentColor" strokeWidth={0} style={{ marginLeft: taille * 0.04 }} />}
    </button>
  );
}
