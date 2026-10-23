import { useEffect, type ReactNode } from "react";
import type { FieldDef, Json } from "../../commun/modele";

export function Champ({ label, large, children }: { label: string; large?: boolean; children: ReactNode }) {
  return (
    <label className={"champ" + (large ? " large" : "")}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Puces({ options, valeur, changer }: {
  options: { value: string; label: string }[];
  valeur: string[];
  changer: (v: string[]) => void;
}) {
  return (
    <div className="puces">
      {options.map((o) => {
        const actif = valeur.includes(o.value);
        return (
          <button key={o.value} type="button" className="puce" aria-pressed={actif}
            onClick={() => changer(actif ? valeur.filter((x) => x !== o.value) : [...valeur, o.value])}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Échelle de douleur 0 → 10 (EVA). */
export function Echelle({ valeur, changer }: { valeur: number | null; changer: (v: number | null) => void }) {
  return (
    <div className="echelle" role="group">
      {Array.from({ length: 11 }, (_, n) => (
        <button key={n} type="button" aria-pressed={valeur === n} onClick={() => changer(valeur === n ? null : n)}>{n}</button>
      ))}
    </div>
  );
}

/** Affiche une série de champs décrits dans commun/modele.ts (bilans, mesures de séance). */
export function ChampsDecrits({ defs, valeur, changer }: { defs: FieldDef[]; valeur: Json; changer: (v: Json) => void }) {
  const maj = (cle: string, v: string | string[]) => changer({ ...valeur, [cle]: v });
  return (
    <div className="grille">
      {defs.map((d) => {
        const v = valeur[d.key];
        if (d.type === "multi") {
          return (
            <div key={d.key} className="champ large">
              <span>{d.label}</span>
              <Puces options={(d.options ?? []).map((o) => ({ value: o, label: o }))}
                valeur={Array.isArray(v) ? v : []} changer={(x) => maj(d.key, x)} />
            </div>
          );
        }
        const texte = typeof v === "string" ? v : "";
        return (
          <Champ key={d.key} label={d.label} large={d.wide || d.type === "textarea"}>
            {d.type === "select" ? (
              <select value={texte} onChange={(e) => maj(d.key, e.target.value)}>
                <option value="">—</option>
                {d.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : d.type === "textarea" ? (
              <textarea value={texte} maxLength={10000} onChange={(e) => maj(d.key, e.target.value)} />
            ) : (
              <input value={texte} placeholder={d.placeholder} maxLength={200}
                inputMode={d.type === "number" ? "decimal" : undefined}
                onChange={(e) => maj(d.key, e.target.value)} />
            )}
          </Champ>
        );
      })}
    </div>
  );
}

/** Affichage en lecture d'une série de champs décrits (seulement ceux remplis). */
export function ValeursDecrites({ defs, valeur }: { defs: FieldDef[]; valeur: Json }) {
  const remplis = defs.filter((d) => {
    const v = valeur[d.key];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });
  if (!remplis.length) return <p className="discret">Rien de noté.</p>;
  return (
    <dl className="infos-grille">
      {remplis.map((d) => {
        const v = valeur[d.key];
        return (
          <div key={d.key} className={"info" + (d.type === "textarea" ? " large" : "")}>
            <dt>{d.label}</dt>
            <dd>{Array.isArray(v) ? v.join(" · ") : v}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Prévient avant de quitter la page si des modifications ne sont pas enregistrées. */
export function useAvertirSiModifie(modifie: boolean) {
  useEffect(() => {
    if (!modifie) return;
    const avant = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avant);
    return () => window.removeEventListener("beforeunload", avant);
  }, [modifie]);
}

export function Message({ erreur, ok }: { erreur?: string; ok?: string }) {
  if (erreur) return <div className="message erreur" role="alert">{erreur}</div>;
  if (ok) return <div className="message ok" role="status">{ok}</div>;
  return null;
}
