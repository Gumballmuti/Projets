"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type MatchScreenProps = {
  /** Titre du mode, discret en haut d'écran. */
  mode: string;
  children: ReactNode;
  /** Zone du bouton principal, en bas, à portée de pouce. */
  action?: ReactNode;
  step?: { current: number; total: number };
  onTap?: () => void;
  tapLabel?: string;
  closeHref?: string;
};

/**
 * Écran « mode match » : fond très contrasté, texte énorme, un seul bouton
 * principal, sans scroll. Le haut d'écran ne contient qu'une croix et le mode.
 */
export function MatchScreen({ mode, children, action, step, onTap, tapLabel, closeHref = "/accueil" }: MatchScreenProps) {
  return (
    <div className="pt-safe pb-safe fixed inset-0 flex flex-col bg-match-bg text-match-ink">
      <header className="flex items-center justify-between gap-2 px-3 pt-2">
        <Link
          href={closeHref}
          aria-label="Quitter le mode match"
          className="flex size-12 items-center justify-center rounded-2xl text-match-muted hover:bg-match-soft"
        >
          <Icon name="close" size={28} />
        </Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-match-muted">{mode}</p>
        <div className="flex size-12 items-center justify-center" aria-hidden={!step}>
          {step && (
            <span className="text-sm font-semibold tabular-nums text-match-muted">
              <span className="sr-only">Étape </span>
              {step.current}/{step.total}
            </span>
          )}
        </div>
      </header>
      {onTap ? (
        <button
          type="button"
          onClick={onTap}
          aria-label={tapLabel}
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
        >
          {children}
        </button>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-5 py-2 text-center tall:gap-6">
          {children}
        </main>
      )}
      {action && <div className="px-4 pb-4">{action}</div>}
    </div>
  );
}

const TITLE_SIZES = {
  xxl: "text-5xl tall:text-6xl sm:text-7xl",
  xl: "text-4xl tall:text-5xl sm:text-6xl",
  lg: "text-3xl tall:text-4xl sm:text-5xl",
  md: "text-2xl tall:text-4xl",
};

export function MatchTitle({ children, className, size = "xl" }: { children: ReactNode; className?: string; size?: keyof typeof TITLE_SIZES }) {
  return (
    <h1 className={cn("font-extrabold leading-[1.1] tracking-tight", TITLE_SIZES[size], className)} aria-live="polite">
      {children}
    </h1>
  );
}

export function MatchText({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-md leading-snug text-match-muted", className ?? "text-xl tall:text-2xl")}>{children}</p>;
}

export function MatchButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls =
    "flex min-h-20 w-full items-center justify-center rounded-3xl bg-match-btn px-6 text-2xl font-extrabold uppercase tracking-wide text-match-on-btn active:scale-[0.98] transition-transform";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Choix en gros boutons, empilés, pour le mode match. */
export function MatchChoices({ options, onPick, columns = 1 }: { options: Array<{ id: string; label: string }>; onPick: (id: string) => void; columns?: 1 | 2 }) {
  return (
    <div className={cn("grid w-full max-w-md gap-2", columns === 2 && "grid-cols-2")}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          className="flex min-h-12 items-center justify-center rounded-2xl border-2 border-match-muted/40 bg-match-soft px-3 py-2 text-base font-semibold tall:min-h-14 tall:text-lg leading-tight text-match-ink active:scale-[0.98]"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
