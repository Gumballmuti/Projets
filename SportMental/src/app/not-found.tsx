import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <LogoMark size={56} />
      <h1 className="text-3xl font-bold text-ink">Page introuvable</h1>
      <p className="text-muted">Cette page n&apos;existe pas. Respire : on te ramène sur le terrain.</p>
      <Link href="/accueil" className={buttonClasses("primary", "lg")}>
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
