"use client";

import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Button, buttonClasses } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <LogoMark size={56} />
      <h1 className="text-3xl font-bold text-ink">Un souci technique</h1>
      <p className="text-muted">Quelque chose s&apos;est mal passé. Tes données sont toujours sur ton téléphone.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={reset}>Réessayer</Button>
        <Link href="/accueil" className={buttonClasses("secondary", "lg")}>Accueil</Link>
      </div>
    </main>
  );
}
