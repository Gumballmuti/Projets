import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:p-3">
        Aller au contenu
      </a>
      <header className="pt-safe sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href="/" aria-label="Sport Mental, accueil" className="inline-flex min-h-12 items-center">
            <Logo size={32} />
          </Link>
          <Link href="/accueil" className={buttonClasses("primary", "md", "px-4")}>
            Ouvrir l&apos;app
          </Link>
        </div>
      </header>
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
