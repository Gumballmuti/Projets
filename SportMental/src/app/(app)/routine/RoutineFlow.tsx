"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Breathing } from "@/components/ui/Breathing";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ChoiceList } from "@/components/ui/ChoiceList";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Visualisation } from "@/components/ui/Visualisation";
import {
  ADAPTATION_ENERGIE,
  ETATS_DU_MOMENT,
  FIN_DE_ROUTINE,
  INTENTIONS,
  MOTS_CLES_SUGGERES,
  NIVEAUX_ENERGIE,
  OBJECTIFS_DU_JOUR,
  PLANS_DE_REBOND,
  RESPIRATION,
  VISUALISATIONS,
  type EnergyLevel,
  type EtatDuMoment,
} from "@/content/routine";
import { VOLLEY_POSTES } from "@/content/sports";
import { bySport, filterBySport } from "@/lib/content";
import { vibrate } from "@/lib/haptics";
import { newId } from "@/lib/storage";
import { useAppData } from "@/lib/store";

type StepId = "respiration" | "checkin" | "adaptation" | "objectif" | "intention" | "rebond" | "visualisation" | "fin";

const TITRES: Record<StepId, string> = {
  respiration: "Respiration",
  checkin: "Où en es-tu ?",
  adaptation: "On ajuste ton énergie",
  objectif: "Ton objectif mental du jour",
  intention: "Ton intention et ton mot-clé",
  rebond: "Ton plan de rebond",
  visualisation: "Visualisation",
  fin: "Prêt",
};

const AUTRE = "__autre";

export function RoutineFlow() {
  const { data, update } = useAppData();
  const { profil } = data;
  const sport = profil.sportActif;
  const courte = profil.preferences.dureeRoutine === "courte";

  const [index, setIndex] = useState(0);
  const [energie, setEnergie] = useState<EnergyLevel | null>(null);
  const [etat, setEtat] = useState<EtatDuMoment | null>(null);
  const [objectif, setObjectif] = useState<string | null>(null);
  const [objectifLibre, setObjectifLibre] = useState("");
  const [intention, setIntention] = useState<string | null>(null);
  const [intentionLibre, setIntentionLibre] = useState("");
  const [motCle, setMotCle] = useState<string | null>(null);
  const [rebond, setRebond] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  const motCleFinal = (motCle ?? profil.motCle).trim();

  const steps: StepId[] = [
    "respiration",
    "checkin",
    ...(energie !== null ? (["adaptation"] as StepId[]) : []),
    ...(courte ? [] : (["objectif"] as StepId[])),
    "intention",
    "rebond",
    ...(courte ? [] : (["visualisation"] as StepId[])),
    "fin",
  ];
  const step = steps[Math.min(index, steps.length - 1)]!;
  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  const niveau = energie === null ? "juste" : energie <= 2 ? "basse" : energie >= 4 ? "haute" : "juste";
  const intentions = filterBySport(INTENTIONS, sport);
  const poste = sport === "volley" ? VOLLEY_POSTES.find((p) => p.id === profil.posteVolley) : undefined;
  const intentionsProposees = [
    ...(poste ? [poste.intention] : []),
    ...profil.intentionsFavorites,
    ...intentions.map((i) => i.text),
  ].filter((t, i, arr) => arr.indexOf(t) === i);
  const motsCles = [
    ...(profil.motCle ? [profil.motCle] : []),
    ...(poste ? poste.motsCles : []),
    ...MOTS_CLES_SUGGERES,
  ].filter((t, i, arr) => arr.indexOf(t) === i);

  function terminer() {
    const intentionFinale = (intention === AUTRE ? intentionLibre : intention ?? "").trim().slice(0, 160);
    const objectifFinal = objectif === AUTRE ? objectifLibre.trim().slice(0, 160) || null : objectif;
    update((d) => ({
      ...d,
      routines: [
        ...d.routines,
        {
          id: newId(),
          date: new Date().toISOString(),
          energie,
          objectif: objectifFinal,
          intention: intentionFinale,
          motCle: motCleFinal,
          planRebond: rebond,
        },
      ].slice(-500),
      profil: {
        ...d.profil,
        motCle: motCleFinal || d.profil.motCle,
        intentionsFavorites: intentionFinale
          ? [intentionFinale, ...d.profil.intentionsFavorites.filter((x) => x !== intentionFinale)].slice(0, 10)
          : d.profil.intentionsFavorites,
      },
    }));
    vibrate([30, 80, 30]);
    setPret(true);
  }

  if (pret) {
    return (
      <div className="-mx-4 -mt-6 flex min-h-[70dvh] flex-col items-center justify-center gap-6 bg-match-bg px-6 py-12 text-center text-match-ink sm:-mx-6 sm:rounded-b-3xl">
        <LogoMark size={64} />
        <div className="flex flex-col gap-2 text-4xl font-extrabold leading-tight">
          {FIN_DE_ROUTINE.message.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        {motCleFinal && (
          <p className="text-xl text-match-muted">
            Ton mot-clé : <strong className="text-3xl text-match-ink">{motCleFinal}</strong>
          </p>
        )}
        <div className="mt-4 flex w-full max-w-sm flex-col gap-3">
          <ButtonLink href="/match/point-suivant" variant="match" size="lg" block>
            Point suivant
          </ButtonLink>
          <Link href="/accueil" className="min-h-12 py-3 font-medium text-match-muted underline underline-offset-4">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {index > 0 ? (
            <button type="button" onClick={prev} className="-ml-2 inline-flex min-h-12 items-center gap-1 rounded-xl px-2 font-medium text-accent hover:bg-soft">
              <Icon name="back" size={20} /> Retour
            </button>
          ) : (
            <span className="text-sm font-semibold uppercase tracking-wide text-muted">Routine pré-match</span>
          )}
          {step !== "fin" && (
            <button type="button" onClick={next} className="inline-flex min-h-12 items-center gap-1 rounded-xl px-3 font-medium text-accent hover:bg-soft">
              Passer <Icon name="skip" size={18} />
            </button>
          )}
        </div>
        <ProgressBar value={(index + 1) / steps.length} label={`Étape ${index + 1} sur ${steps.length}`} />
        <h1 className="text-3xl font-bold tracking-tight text-ink">{TITRES[step]}</h1>
      </div>

      {step === "respiration" && (
        <div className="flex flex-col gap-6">
          <p className="text-muted">{RESPIRATION.intro}</p>
          <Breathing
            inspire={RESPIRATION.inspire}
            pause={profil.preferences.pauseRespiration ? RESPIRATION.pause : 0}
            expire={RESPIRATION.expire}
            cycles={courte ? 3 : RESPIRATION.cycles}
            textes={RESPIRATION.textes}
            onDone={next}
          />
          <p className="text-center text-sm text-muted">{RESPIRATION.securite}</p>
        </div>
      )}

      {step === "checkin" && (
        <div className="flex flex-col gap-6">
          <ChoiceList
            legend="Ton niveau d'énergie maintenant"
            value={energie === null ? null : String(energie)}
            onChange={(v) => setEnergie(Number(v) as EnergyLevel)}
            options={NIVEAUX_ENERGIE.map((n) => ({ value: String(n.value), label: n.label, hint: n.hint }))}
          />
          <ChoiceList
            legend="Et dans ta tête ?"
            layout="chips"
            value={etat}
            onChange={setEtat}
            options={ETATS_DU_MOMENT.map((e) => ({ value: e.value, label: e.label }))}
          />
          <Button size="lg" onClick={next}>Continuer</Button>
        </div>
      )}

      {step === "adaptation" && (
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-ink">{ADAPTATION_ENERGIE[niveau].titre}</h2>
          {etat === "frustre" && (
            <p className="rounded-2xl bg-soft p-4 text-ink">
              Ce souvenir appartient au passé. Le match d&apos;aujourd&apos;hui commence à zéro, pour tout le monde.
            </p>
          )}
          {etat === "distrait" && (
            <p className="rounded-2xl bg-soft p-4 text-ink">
              Nomme ce qui t&apos;occupe l&apos;esprit, puis pose-le de côté jusqu&apos;à la fin du match. Il t&apos;attendra.
            </p>
          )}
          <ol className="flex flex-col gap-3">
            {ADAPTATION_ENERGIE[niveau].etapes.map((e, i) => (
              <li key={e} className="flex gap-3 text-ink">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft font-semibold text-accent">{i + 1}</span>
                <span className="pt-1 leading-relaxed">{e}</span>
              </li>
            ))}
          </ol>
          {niveau === "haute" && (
            <Breathing
              inspire={RESPIRATION.inspire}
              pause={0}
              expire={RESPIRATION.expire + 2}
              cycles={courte ? 3 : 4}
              autoStart={false}
            />
          )}
          <Button size="lg" onClick={next}>Continuer</Button>
        </div>
      )}

      {step === "objectif" && (
        <div className="flex flex-col gap-6">
          <ChoiceList
            legend="Choisis un seul objectif"
            hideLegend
            value={objectif}
            onChange={setObjectif}
            options={[
              ...OBJECTIFS_DU_JOUR.map((o) => ({ value: bySport(o.label, sport), label: bySport(o.label, sport) })),
              { value: AUTRE, label: "Autre" },
            ]}
          />
          {objectif === AUTRE && (
            <TextField label="Ton objectif" maxLength={160} value={objectifLibre} onChange={(e) => setObjectifLibre(e.target.value)} placeholder="Ex. Garder mon calme au service" />
          )}
          <Button size="lg" onClick={next}>Continuer</Button>
        </div>
      )}

      {step === "intention" && (
        <div className="flex flex-col gap-6">
          <ChoiceList
            legend="Ton intention pour ce match"
            value={intention}
            onChange={setIntention}
            options={[...intentionsProposees.slice(0, 8).map((t) => ({ value: t, label: t })), { value: AUTRE, label: "J'écris la mienne" }]}
          />
          {intention === AUTRE && (
            <TextField label="Ton intention" maxLength={160} value={intentionLibre} onChange={(e) => setIntentionLibre(e.target.value)} placeholder="Ex. Je joue chaque balle en entier" hint="Formule-la en positif : ce que tu fais, pas ce que tu évites." />
          )}
          <ChoiceList
            legend="Ton mot-clé (tu le retrouveras pendant le match)"
            layout="chips"
            value={motCle !== null && motsCles.includes(motCle) ? motCle : null}
            onChange={setMotCle}
            options={motsCles.slice(0, 10).map((m) => ({ value: m, label: m }))}
          />
          <TextField
            label="Ou écris le tien"
            maxLength={20}
            value={motCle !== null && !motsCles.includes(motCle) ? motCle : ""}
            onChange={(e) => setMotCle(e.target.value.replace(/\s+/g, " ").slice(0, 20))}
            placeholder="Une ou deux syllabes"
          />
          <Button size="lg" onClick={next}>Continuer</Button>
        </div>
      )}

      {step === "rebond" && (
        <div className="flex flex-col gap-6">
          <p className="text-lg text-ink">« Si je fais une erreur, je… »</p>
          <ChoiceList
            legend="Si je fais une erreur, je…"
            hideLegend
            value={rebond}
            onChange={setRebond}
            options={PLANS_DE_REBOND.map((p) => ({ value: bySport(p.label, sport), label: bySport(p.label, sport) }))}
          />
          <p className="text-sm text-muted">Décider maintenant ce que tu feras rend la réaction plus facile sur le moment.</p>
          <Button size="lg" onClick={next}>Continuer</Button>
        </div>
      )}

      {step === "visualisation" && (
        <Visualisation segments={sport === "autre" ? VISUALISATIONS.all : VISUALISATIONS[sport]} onDone={next} />
      )}

      {step === "fin" && (
        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="text-4xl font-extrabold text-ink">{FIN_DE_ROUTINE.titre}</p>
          {motCleFinal && <p className="text-lg text-muted">Ton mot-clé : <strong className="text-ink">{motCleFinal}</strong></p>}
          <Button size="xl" block onClick={terminer}>
            {FIN_DE_ROUTINE.bouton}
          </Button>
        </div>
      )}
    </div>
  );
}
