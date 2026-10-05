"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "sport-mental:install-hint";

function getPlatform(): "installed" | "ios" | "other" {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

const noop = () => () => {};

/** Explique comment installer l'app (iPhone : Partager → Sur l'écran d'accueil ; Android : bouton). */
export function InstallHint({ dismissible = false }: { dismissible?: boolean }) {
  const platform = useSyncExternalStore(noop, getPlatform, () => "installed" as const);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissible || typeof window === "undefined") return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (platform === "installed" || dismissed) return null;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5" suppressHydrationWarning>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-soft text-accent">
          <Icon name="download" size={20} />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink">Installe Sport Mental sur ton téléphone</p>
          <p className="text-sm text-muted">Accès en un tap depuis l&apos;écran d&apos;accueil, même sans réseau au club.</p>
        </div>
        {dismissible && (
          <button
            type="button"
            aria-label="Masquer ce conseil"
            onClick={() => {
              setDismissed(true);
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {
                /* sans importance */
              }
            }}
            className="-m-2 flex size-12 items-center justify-center rounded-xl text-muted hover:bg-soft"
          >
            <Icon name="close" size={20} />
          </button>
        )}
      </div>
      {platform === "ios" ? (
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-ink">
          <li>Ouvre cette page dans <strong>Safari</strong>.</li>
          <li>Touche le bouton <strong>Partager</strong> (carré avec une flèche vers le haut).</li>
          <li>Choisis <strong>Sur l&apos;écran d&apos;accueil</strong>, puis <strong>Ajouter</strong>.</li>
        </ol>
      ) : prompt ? (
        <Button
          onClick={async () => {
            await prompt.prompt();
            setPrompt(null);
          }}
        >
          Installer l&apos;app
        </Button>
      ) : (
        <p className="text-sm text-ink">
          Dans le menu du navigateur (⋮), choisis <strong>Installer l&apos;application</strong> ou <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.
        </p>
      )}
    </div>
  );
}
