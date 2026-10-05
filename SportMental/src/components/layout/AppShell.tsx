"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { useAppData } from "@/lib/store";

const NAV: Array<{ href: string; label: string; icon: IconName; match: string[] }> = [
  { href: "/accueil", label: "Accueil", icon: "home", match: ["/accueil"] },
  { href: "/routine", label: "Routine", icon: "routine", match: ["/routine"] },
  { href: "/exercices", label: "Exercices", icon: "exercises", match: ["/exercices", "/programmes"] },
  { href: "/progression", label: "Progression", icon: "progress", match: ["/progression", "/bilan", "/preuves"] },
  { href: "/profil", label: "Profil", icon: "profile", match: ["/profil"] },
];

export const URGENCES: Array<{ href: string; label: string; court: string; icon: IconName }> = [
  { href: "/match/point-suivant", label: "Point suivant", court: "Point suivant", icon: "next" },
  { href: "/match/erreur", label: "J'ai fait une erreur", court: "Erreur", icon: "refresh" },
  { href: "/match/pression", label: "Je suis sous pression", court: "Pression", icon: "pulse" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loaded, status } = useAppData();

  // Mode invité : premier passage → choix du sport.
  useEffect(() => {
    if (loaded && !data.profil.onboarded) router.replace("/bienvenue");
  }, [loaded, data.profil.onboarded, router]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:p-3"
      >
        Aller au contenu
      </a>
      <main id="contenu" className="pt-safe mx-auto w-full max-w-2xl flex-1 px-4 pb-44 pt-6 sm:px-6">
        {status !== "ok" && (
          <Notice className="mb-4" title="Sauvegarde impossible sur cet appareil">
            {status === "quota"
              ? "L'espace de stockage est plein. Exporte tes données depuis le profil, puis libère de la place."
              : "Ton navigateur bloque le stockage (navigation privée ?). L'app fonctionne, mais tes données seront perdues en fermant la page."}
          </Notice>
        )}
        {children}
      </main>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
        <nav aria-label="Aide pendant le match" className="mx-auto grid max-w-2xl grid-cols-3 gap-2 px-3 pt-2">
          {URGENCES.map((u) => (
            <Link
              key={u.href}
              href={u.href}
              aria-label={u.label}
              className="flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-primary px-1 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              <Icon name={u.icon} size={18} className="hidden min-[440px]:block" />
              {u.court}
            </Link>
          ))}
        </nav>
        <nav aria-label="Navigation principale" className="mx-auto grid max-w-2xl grid-cols-5">
          {NAV.map((item) => {
            const active = item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  active ? "text-accent" : "text-muted hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={22} strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
