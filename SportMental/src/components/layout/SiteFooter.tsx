import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Disclaimer } from "@/components/ui/Disclaimer";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <LogoMark size={24} />
          Sport Mental
        </div>
        <Disclaimer className="max-w-2xl" />
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
          <Link href="/confidentialite" className="inline-flex min-h-12 items-center px-2 text-accent underline-offset-4 hover:underline">
            Confidentialité
          </Link>
          <Link href="/conditions" className="inline-flex min-h-12 items-center px-2 text-accent underline-offset-4 hover:underline">
            Conditions d&apos;utilisation
          </Link>
          <Link href="/mentions-legales" className="inline-flex min-h-12 items-center px-2 text-accent underline-offset-4 hover:underline">
            Mentions légales
          </Link>
        </nav>
        <p className="text-sm text-muted">Sans compte · Gratuit · Tes données restent sur ton téléphone.</p>
      </div>
    </footer>
  );
}
