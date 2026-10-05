"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ChoiceList } from "@/components/ui/ChoiceList";
import { TextArea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { RatingScale } from "@/components/ui/RatingScale";
import { SoutienNotice } from "@/components/ui/SoutienNotice";
import {
  A_AMELIORER,
  DIMENSIONS,
  MOMENTS_REBOND,
  OUTILS_UTILISES,
  POINTS_FORTS,
  POINTS_POSITIFS,
  RECOMMANDATIONS,
  RESSENTIS,
  type DimensionId,
  type OutilId,
  type RessentiId,
} from "@/content/bilan";
import { EXERCICES } from "@/content/exercices";
import { PROGRAMMES } from "@/content/programmes";
import { TYPES_ERREUR } from "@/content/erreur";
import { bySport } from "@/lib/content";
import { cn } from "@/lib/cn";
import { detectDistress } from "@/lib/sante";
import { extremes } from "@/lib/stats";
import { LIMITES, newId, type MatchBilan } from "@/lib/storage";
import { useAppData } from "@/lib/store";

const LIBRE = "__libre";

function ChoixOuLibre({ legend, options, value, onChange, libre, onLibre, placeholder }: {
  legend: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  libre: string;
  onLibre: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ChoiceList legend={legend} value={value} onChange={onChange} options={[...options.map((o) => ({ value: o, label: o })), { value: LIBRE, label: "Autre (j'écris)" }]} />
      {value === LIBRE && (
        <TextArea label="Précise" rows={2} maxLength={LIMITES.texteLong} value={libre} onChange={(e) => onLibre(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

export function BilanForm() {
  const { data, update } = useAppData();
  const sport = data.profil.sportActif;
  const [notes, setNotes] = useState<Partial<Record<DimensionId, number>>>({});
  const [rebond, setRebond] = useState<string | null>(null);
  const [rebondLibre, setRebondLibre] = useState("");
  const [fort, setFort] = useState<string | null>(null);
  const [fortLibre, setFortLibre] = useState("");
  const [ameliorer, setAmeliorer] = useState<string | null>(null);
  const [ameliorerLibre, setAmeliorerLibre] = useState("");
  const [outils, setOutils] = useState<OutilId[]>([]);
  const [resultat, setResultat] = useState<"victoire" | "defaite" | "aucun" | null>(null);
  const [ressenti, setRessenti] = useState<RessentiId | null>(null);
  const [ressentiTexte, setRessentiTexte] = useState("");
  const [ajouterPreuve, setAjouterPreuve] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [saved, setSaved] = useState<MatchBilan | null>(null);

  // Erreurs notées en mode match ces 12 dernières heures (pour aider le bilan).
  const [now] = useState(() => Date.now());
  const erreursRecentes = data.erreurs.filter((e) => now - Date.parse(e.date) < 12 * 3600 * 1000);

  const val = (choice: string | null, libre: string) => (choice === LIBRE ? libre.trim() : choice ?? "").slice(0, LIMITES.texteLong);

  function toggleOutil(id: OutilId) {
    setOutils((o) => {
      if (id === "aucun") return o.includes("aucun") ? [] : ["aucun"];
      const without = o.filter((x) => x !== "aucun");
      return without.includes(id) ? without.filter((x) => x !== id) : [...without, id];
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const manquantes = DIMENSIONS.filter((d) => notes[d.id] === undefined);
    if (manquantes.length) {
      setErreur(`Il manque ${manquantes.length === 1 ? "une note" : `${manquantes.length} notes`} : ${manquantes.map((d) => d.court).join(", ")}.`);
      document.getElementById("notes")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErreur(null);
    const match: MatchBilan = {
      id: newId(),
      date: new Date().toISOString(),
      sport,
      notes: notes as Record<DimensionId, number>,
      momentRebond: val(rebond, rebondLibre),
      pointFort: val(fort, fortLibre),
      aAmeliorer: val(ameliorer, ameliorerLibre),
      outils,
      resultat: resultat === "victoire" || resultat === "defaite" ? resultat : null,
      ressenti,
      ressentiTexte: ressentiTexte.trim().slice(0, LIMITES.texteLong),
    };
    const preuve = [match.momentRebond && `J'ai bien rebondi : ${match.momentRebond}`, match.pointFort && `Point fort : ${match.pointFort}`]
      .filter(Boolean)
      .join(" · ");
    update((d) => ({
      ...d,
      matchs: [...d.matchs, match].slice(-500),
      preuves: ajouterPreuve && preuve ? [...d.preuves, { id: newId(), date: match.date, texte: preuve.slice(0, LIMITES.texteLong) }] : d.preuves,
    }));
    setSaved(match);
    window.scrollTo({ top: 0 });
  }

  if (saved) {
    const { basse, haute, egales } = extremes(saved.notes);
    const reco = RECOMMANDATIONS[basse];
    const programme = reco.programme ? PROGRAMMES.find((p) => p.id === reco.programme) : undefined;
    const exercice = EXERCICES.find((x) => x.id === reco.exerciceId);
    const detresse = detectDistress(saved.ressentiTexte, saved.momentRebond, saved.pointFort, saved.aAmeliorer);
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Bilan enregistré" subtitle="Merci d'avoir pris ce temps. C'est comme ça qu'on progresse." />
        {detresse && <SoutienNotice />}
        <Card className="flex flex-col gap-2">
          <CardTitle>Ton point positif</CardTitle>
          <p className="text-ink">
            {egales ? "Tes notes sont équilibrées : tu as une base régulière sur laquelle t'appuyer." : POINTS_POSITIFS[haute]}
          </p>
          {saved.momentRebond && <p className="text-muted">Tu as bien rebondi : {saved.momentRebond}</p>}
        </Card>
        {!egales && (
          <Card className="flex flex-col gap-3">
            <CardTitle>Ma recommandation</CardTitle>
            <p className="text-ink">{reco.texte}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {programme && <ButtonLink href={`/programmes/${programme.id}`}>Programme {programme.titre.toLowerCase()}</ButtonLink>}
              {exercice && (
                <ButtonLink href={`/exercices/${exercice.id}`} variant="secondary">
                  Exercice : {exercice.titre}
                </ButtonLink>
              )}
            </div>
          </Card>
        )}
        <Notice>Ton bilan est enregistré sur ce téléphone. Pense à exporter tes données de temps en temps depuis ton profil.</Notice>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/progression" variant="secondary">Voir ma progression</ButtonLink>
          <ButtonLink href="/accueil" variant="ghost">Retour à l&apos;accueil</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <PageHeader
        title="Bilan d'après-match"
        subtitle="Quelques minutes pour retenir ce qui a marché. Le score n'est pas le sujet : on regarde ton process."
        backHref="/progression"
        backLabel="Progression"
      />

      {erreursRecentes.length > 0 && (
        <Notice title="Pendant ce match">
          Tu as utilisé le mode « J&apos;ai fait une erreur » {erreursRecentes.length} fois
          {(() => {
            const types = TYPES_ERREUR.map((t) => ({ t, n: erreursRecentes.filter((e) => e.type === t.id).length })).filter((x) => x.n > 0);
            return types.length ? ` (${types.map((x) => `${x.t.label.toLowerCase()} : ${x.n}`).join(", ")})` : "";
          })()}
          . Chaque fois, tu as choisi de revenir dans le jeu.
        </Notice>
      )}

      <section id="notes" className="flex scroll-mt-4 flex-col gap-6">
        <h2 className="text-xl font-semibold text-ink">Tes notes de 1 à 10</h2>
        {DIMENSIONS.map((d) => (
          <RatingScale
            key={d.id}
            label={bySport(d.label, sport)}
            value={notes[d.id] ?? null}
            onChange={(v) => setNotes((n) => ({ ...n, [d.id]: v }))}
          />
        ))}
        {erreur && DIMENSIONS.some((d) => notes[d.id] === undefined) && (
          <p role="alert" className="font-medium text-danger">
            {erreur}
          </p>
        )}
      </section>

      <ChoixOuLibre legend="Un moment où tu as bien rebondi" options={MOMENTS_REBOND} value={rebond} onChange={setRebond} libre={rebondLibre} onLibre={setRebondLibre} placeholder="Ex. Après deux doubles fautes, j'ai respiré et servi dans le corps." />
      <ChoixOuLibre legend="Ton principal point fort aujourd'hui" options={POINTS_FORTS} value={fort} onChange={setFort} libre={fortLibre} onLibre={setFortLibre} placeholder="Ex. Mes lobs profonds" />
      <ChoixOuLibre legend="Ce que tu veux améliorer au prochain match" options={A_AMELIORER} value={ameliorer} onChange={setAmeliorer} libre={ameliorerLibre} onLibre={setAmeliorerLibre} placeholder="Ex. Communiquer après chaque point perdu" />

      <fieldset>
        <legend className="mb-3 font-semibold text-ink">Quels outils de l&apos;app as-tu utilisés ?</legend>
        <div className="flex flex-wrap gap-2">
          {OUTILS_UTILISES.map((o) => {
            const on = outils.includes(o.id);
            return (
              <label key={o.id} className={cn("flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 px-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus", on ? "border-primary bg-soft" : "border-line bg-surface")}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleOutil(o.id)} />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <ChoiceList
        legend="Résultat (facultatif)"
        layout="chips"
        value={resultat}
        onChange={setResultat}
        options={[
          { value: "victoire", label: "Victoire" },
          { value: "defaite", label: "Défaite" },
          { value: "aucun", label: "Je préfère ne pas le noter" },
        ]}
      />

      <div className="flex flex-col gap-3">
        <ChoiceList legend="Comment te sens-tu maintenant ?" layout="chips" value={ressenti} onChange={setRessenti} options={RESSENTIS.map((r) => ({ value: r.id, label: r.label }))} />
        <TextArea label="Envie d'en dire plus ? (facultatif)" rows={3} maxLength={LIMITES.texteLong} value={ressentiTexte} onChange={(e) => setRessentiTexte(e.target.value)} />
        {detectDistress(ressentiTexte) && <SoutienNotice />}
      </div>

      <label className="flex min-h-12 cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={ajouterPreuve} onChange={(e) => setAjouterPreuve(e.target.checked)} />
        <span className="text-ink">Ajouter mon rebond et mon point fort à mon <Link href="/preuves" className="text-accent underline">carnet de preuves</Link></span>
      </label>

      <Button type="submit" size="lg">Enregistrer mon bilan</Button>
    </form>
  );
}
