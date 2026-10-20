import { useState } from "react";

interface Props {
  valeur: number;
  max: number;
  onValider: (v: number) => void; // à la fin du glissement (ou à chaque pas pour le volume)
  continu?: boolean;
  libelle: string;
  onDeplacer?: (v: number | null) => void;
}

/** Barre de progression / de volume : blanche, verte au survol, avec la pastille. */
export default function Curseur({ valeur, max, onValider, continu, libelle, onDeplacer }: Props) {
  const [glisse, setGlisse] = useState<number | null>(null);
  const v = glisse ?? valeur;
  const pct = max > 0 ? Math.min(100, (v / max) * 100) : 0;
  const fin = () => {
    if (glisse !== null) onValider(glisse);
    setGlisse(null);
    onDeplacer?.(null);
  };
  return (
    <input type="range" className="curseur" aria-label={libelle} min={0} max={max || 1} step={max > 2 ? 1 : 0.01} value={v}
      style={{ "--pct": `${pct}%` } as React.CSSProperties}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (continu) return onValider(n);
        setGlisse(n);
        onDeplacer?.(n);
      }}
      onPointerUp={fin} onKeyUp={fin} onTouchEnd={fin} onBlur={fin} />
  );
}
