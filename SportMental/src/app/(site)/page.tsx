import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
};

const BENEFICES: Array<{ icon: IconName; titre: string; texte: string }> = [
  { icon: "target", titre: "Rester concentré", texte: "Ramène ton attention sur la balle et sur ton plan, action après action." },
  { icon: "refresh", titre: "Gérer les erreurs", texte: "Reconnaître, relâcher, recentrer : une séquence courte pour repartir." },
  { icon: "pulse", titre: "Mieux vivre la pression", texte: "Ton cœur accélère ? C'est de l'énergie. Apprends à l'utiliser." },
  { icon: "star", titre: "Renforcer la confiance", texte: "Une confiance fondée sur tes réussites réelles, notées dans ton carnet de preuves." },
  { icon: "users", titre: "Communiquer", texte: "Des phrases courtes et positives avec ton partenaire ou tes coéquipiers." },
  { icon: "next", titre: "Jouer action par action", texte: "Une routine entre les points qui tient en quelques secondes." },
];

const ETAPES = [
  { titre: "Choisis ton sport", texte: "Padel, volley-ball ou un autre sport de match. Le contenu s'adapte." },
  { titre: "Prépare-toi avant le match", texte: "Une routine de 3 à 5 minutes : respiration, intention, mot-clé, visualisation." },
  { titre: "Utilise-la pendant le match", texte: "Trois boutons, un tap, moins de 5 secondes. Puis fais ton bilan après." },
];

const MODES = [
  { titre: "Point suivant", grand: "Relâche · Lis · Décide · Engage", texte: "Ta routine entre deux points, avec ton mot-clé." },
  { titre: "J'ai fait une erreur", grand: "C'est fait. Ce point est terminé.", texte: "Respire, ferme le point, choisis ce que tu contrôles." },
  { titre: "Je suis sous pression", grand: "Ton corps se prépare.", texte: "Balle de break, fin de set, série adverse : une mini-routine dédiée." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-mint/50 blur-3xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 md:flex-row md:items-center md:pt-20">
          <div className="flex flex-1 flex-col gap-6">
            <p className="w-fit rounded-full bg-soft px-3 py-1 text-sm font-medium text-accent">
              Padel · Volley-ball · Sports de match
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Ton meilleur jeu commence dans ta tête.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              Prépare ton mental, gère la pression et transforme les moments difficiles en opportunités.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row [&>a]:whitespace-nowrap">
              <ButtonLink href="/accueil" size="lg">
                Commencer gratuitement
              </ButtonLink>
              <ButtonLink href="#decouvrir" variant="secondary" size="lg">
                Découvrir Sport Mental
              </ButtonLink>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Icon name="lock" size={18} className="text-accent" />
              Sans compte, gratuit, tes données restent sur ton téléphone.
            </p>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-xs rounded-[2.5rem] border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-match-bg px-5 py-10 text-center text-match-ink">
                <LogoMark size={56} />
                <p className="text-3xl font-extrabold">Respire.</p>
                <p className="text-lg text-match-muted">Le point précédent est terminé.</p>
                <span className="mt-2 w-full rounded-2xl bg-match-btn py-4 text-lg font-bold uppercase tracking-wide text-match-on-btn">
                  C&apos;est parti
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi */}
      <section id="decouvrir" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Pourquoi ?</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Dans tous les sports, une erreur ne coûte souvent qu&apos;un point. Mais la manière dont tu réagis peut influencer les suivants.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICES.map((b) => (
              <li key={b.titre} className="flex gap-4 rounded-3xl border border-line bg-bg p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-soft text-accent">
                  <Icon name={b.icon} />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{b.titre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{b.texte}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comment ça marche */}
      <section>
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Comment ça marche</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="rounded-3xl border border-line bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{e.titre}</h3>
                <p className="mt-2 leading-relaxed text-muted">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Modes match */}
      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Pendant le match, en un tap</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Écrans très lisibles, utilisables d&apos;une main, même en plein soleil. Pensés pour les 20 secondes entre deux points.
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {MODES.map((m) => (
              <li key={m.titre} className="flex flex-col gap-3 rounded-3xl border border-line bg-match-bg p-6 text-match-ink">
                <p className="text-sm font-semibold uppercase tracking-wide text-match-muted">{m.titre}</p>
                <p className="text-2xl font-extrabold leading-snug">{m.grand}</p>
                <p className="text-match-muted">{m.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Confiance & vie privée */}
      <section>
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Sans compte. Gratuit. Chez toi.</h2>
          <ul className="grid w-full gap-3 sm:grid-cols-3">
            {[
              { icon: "lock" as const, t: "Tes notes restent sur ton téléphone. Aucun tracking." },
              { icon: "download" as const, t: "Exporte ou supprime tes données quand tu veux." },
              { icon: "bolt" as const, t: "Fonctionne hors connexion, installable sur l'écran d'accueil." },
            ].map((x) => (
              <li key={x.t} className="flex items-start gap-3 rounded-2xl bg-soft p-4 text-ink">
                <Icon name={x.icon} size={20} className="mt-0.5 text-accent" />
                <span>{x.t}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="/accueil" size="lg">
            Commencer gratuitement
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
