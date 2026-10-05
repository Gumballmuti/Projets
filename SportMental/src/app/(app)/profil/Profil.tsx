"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ChoiceList } from "@/components/ui/ChoiceList";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SPORTS, SPORT_CHOICES, VOLLEY_POSTES } from "@/content/sports";
import type { SportChoice, SportId } from "@/content/types";
import { cn } from "@/lib/cn";
import { exportJson, importJson, type AppData, type Niveau, type Profil as ProfilData } from "@/lib/storage";
import { replaceData, resetAllData, useAppData } from "@/lib/store";

const NIVEAUX: Array<{ value: Niveau; label: string }> = [
  { value: "debutant", label: "Débutant" },
  { value: "loisir", label: "Loisir" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "confirme", label: "Confirmé" },
  { value: "competition", label: "Compétition" },
];

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-4 py-1">
      <span className="flex-1">
        <span className="block font-medium text-ink">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
          checked ? "bg-primary" : "bg-line-strong",
        )}
      >
        <span className={cn("absolute top-1 size-6 rounded-full bg-surface shadow transition-transform", checked ? "translate-x-7" : "translate-x-1")} />
      </span>
    </label>
  );
}

export function Profil() {
  const { data, loaded, update } = useAppData();
  const { profil } = data;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nouvelleIntention, setNouvelleIntention] = useState("");

  const setProfil = (patch: Partial<ProfilData>) => update((d) => ({ ...d, profil: { ...d.profil, ...patch } }));
  const setPref = (patch: Partial<ProfilData["preferences"]>) =>
    update((d) => ({ ...d, profil: { ...d.profil, preferences: { ...d.profil.preferences, ...patch } } }));

  const principal: SportChoice = profil.sports[0] ?? "autre";
  const second = profil.sports[1] as SportId | undefined;
  const autreSport: SportId | null = principal === "padel" ? "volley" : principal === "volley" ? "padel" : null;

  function setPrincipal(s: SportChoice) {
    const sports: SportChoice[] = second && second !== s && s !== "autre" ? [s, second] : [s];
    setProfil({ sports, sportActif: s });
  }

  function exporter() {
    const blob = new Blob([exportJson(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sport-mental-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage({ tone: "ok", text: "Export prêt : garde ce fichier en lieu sûr (il contient tes notes personnelles)." });
  }

  async function choisirFichier(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5_000_000) {
      setMessage({ tone: "err", text: "Le fichier est trop volumineux." });
      return;
    }
    const result = importJson(await file.text());
    if (!result.ok) {
      setMessage({ tone: "err", text: result.error });
      return;
    }
    setPendingImport(result.data);
    setMessage(null);
  }

  if (!loaded) return <PageHeader title="Profil" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profil" subtitle="Tout reste sur ce téléphone. Rien n'est envoyé." />

      <Card className="flex flex-col gap-5">
        <CardTitle>Toi</CardTitle>
        <TextField label="Prénom" maxLength={40} autoComplete="given-name" value={profil.prenom} onChange={(e) => setProfil({ prenom: e.target.value.slice(0, 40) })} />
        <ChoiceList legend="Sport principal" layout="chips" value={principal} onChange={setPrincipal} options={SPORT_CHOICES.map((s) => ({ value: s, label: SPORTS[s].label }))} />
        {autreSport && (
          <Toggle
            label={`Je joue aussi au ${SPORTS[autreSport].label.toLowerCase()}`}
            hint="Tu pourras basculer d'un sport à l'autre depuis l'accueil."
            checked={second === autreSport}
            onChange={(v) => setProfil({ sports: v ? [principal, autreSport] : [principal], sportActif: v ? profil.sportActif : principal })}
          />
        )}
        {(principal === "volley" || second === "volley") && (
          <ChoiceList legend="Poste au volley" value={profil.posteVolley} onChange={(v) => setProfil({ posteVolley: v })} options={VOLLEY_POSTES.map((p) => ({ value: p.id, label: p.label }))} />
        )}
        <ChoiceList legend="Niveau" layout="chips" value={profil.niveau} onChange={(v) => setProfil({ niveau: v })} options={NIVEAUX} />
        <TextField label="Classement (facultatif)" maxLength={40} value={profil.classement} onChange={(e) => setProfil({ classement: e.target.value.slice(0, 40) })} placeholder="Ex. P300, Régionale 2…" />
        <TextField label="Objectif principal" maxLength={160} value={profil.objectifPrincipal} onChange={(e) => setProfil({ objectifPrincipal: e.target.value.slice(0, 160) })} placeholder="Ex. Mieux gérer les fins de set" />
        <p className="text-sm text-muted">
          Matchs enregistrés : <strong className="text-ink">{data.matchs.length}</strong>
        </p>
      </Card>

      <Card className="flex flex-col gap-5">
        <CardTitle>Mon mot-clé et mes intentions</CardTitle>
        <TextField label="Mon mot-clé" hint="Une ou deux syllabes, affiché pendant le match." maxLength={20} value={profil.motCle} onChange={(e) => setProfil({ motCle: e.target.value.slice(0, 20) })} />
        <div className="flex flex-col gap-2">
          <p className="font-medium text-ink">Intentions favorites</p>
          {profil.intentionsFavorites.length === 0 && <p className="text-sm text-muted">Elles s&apos;ajoutent quand tu fais ta routine pré-match.</p>}
          <ul className="flex flex-col gap-2">
            {profil.intentionsFavorites.map((i) => (
              <li key={i} className="flex items-center gap-2 rounded-2xl bg-soft pl-4">
                <span className="flex-1 py-2 text-ink">{i}</span>
                <button type="button" aria-label={`Retirer l'intention : ${i}`} onClick={() => setProfil({ intentionsFavorites: profil.intentionsFavorites.filter((x) => x !== i) })} className="flex size-12 items-center justify-center rounded-xl text-muted hover:text-ink">
                  <Icon name="close" size={20} />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = nouvelleIntention.trim().slice(0, 160);
              if (t.length < 3) return;
              setProfil({ intentionsFavorites: [t, ...profil.intentionsFavorites.filter((x) => x !== t)].slice(0, 10) });
              setNouvelleIntention("");
            }}
          >
            <TextField className="flex-1" label="Ajouter une intention" maxLength={160} value={nouvelleIntention} onChange={(e) => setNouvelleIntention(e.target.value)} placeholder="Ex. Je joue chaque balle en entier" />
            <Button type="submit" variant="secondary" aria-label="Ajouter l'intention"><Icon name="plus" size={20} /></Button>
          </form>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <CardTitle>Préférences</CardTitle>
        <ChoiceList
          legend="Durée de la routine pré-match"
          layout="chips"
          value={profil.preferences.dureeRoutine}
          onChange={(v) => setPref({ dureeRoutine: v })}
          options={[
            { value: "courte", label: "Courte (≈ 2 min)" },
            { value: "complete", label: "Complète (3 à 5 min)" },
          ]}
        />
        <Toggle label="Pause de 2 s dans la respiration" hint="Certaines personnes la trouvent inconfortable : tu peux la retirer." checked={profil.preferences.pauseRespiration} onChange={(v) => setPref({ pauseRespiration: v })} />
        <Toggle label="Vibrations" hint="Sur Android. L'iPhone ne permet pas aux sites web de vibrer." checked={profil.preferences.vibrations} onChange={(v) => setPref({ vibrations: v })} />
        <Toggle label="Sons doux" hint="Un léger signal aux changements de respiration." checked={profil.preferences.sons} onChange={(v) => setPref({ sons: v })} />
        <ChoiceList
          legend="Apparence"
          layout="chips"
          value={profil.theme}
          onChange={(v) => setProfil({ theme: v })}
          options={[
            { value: "system", label: "Automatique" },
            { value: "light", label: "Clair" },
            { value: "dark", label: "Sombre" },
          ]}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle>Mes données</CardTitle>
        <p className="text-sm text-muted">
          Tes données restent sur ce téléphone, sans compte. Exporte-les pour les sauvegarder ou les passer sur un autre appareil.
        </p>
        {message && (
          <p role="status" className={cn("rounded-2xl p-3 text-sm", message.tone === "ok" ? "bg-soft text-ink" : "border border-danger text-danger")}>
            {message.text}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={exporter}><Icon name="download" size={20} /> Exporter (JSON)</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={20} /> Importer</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={choisirFichier} />
        </div>
        {pendingImport && (
          <Notice title="Remplacer tes données actuelles ?">
            <p>
              Le fichier contient {pendingImport.matchs.length} match(s), {pendingImport.preuves.length} preuve(s) et {pendingImport.routines.length} routine(s).
              Tes données actuelles seront remplacées.
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => { replaceData(pendingImport); setPendingImport(null); setMessage({ tone: "ok", text: "Import terminé." }); }}>Remplacer</Button>
              <Button variant="ghost" onClick={() => setPendingImport(null)}>Annuler</Button>
            </div>
          </Notice>
        )}
        {confirmDelete ? (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-danger p-4">
            <p className="font-semibold text-ink">Tout supprimer définitivement ?</p>
            <p className="text-sm text-muted">Profil, matchs, routines, preuves et programmes seront effacés de ce téléphone. Pense à exporter avant si tu veux les garder.</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => { resetAllData(); setConfirmDelete(false); router.push("/"); }}>Oui, tout supprimer</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={20} /> Supprimer toutes mes données</Button>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <Disclaimer />
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-2 text-sm">
          <Link href="/confidentialite" className="inline-flex min-h-12 items-center px-1 text-accent underline">Confidentialité</Link>
          <Link href="/conditions" className="inline-flex min-h-12 items-center px-1 text-accent underline">Conditions</Link>
          <Link href="/mentions-legales" className="inline-flex min-h-12 items-center px-1 text-accent underline">Mentions légales</Link>
        </nav>
      </Card>
    </div>
  );
}
