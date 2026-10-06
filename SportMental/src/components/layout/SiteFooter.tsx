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
        <p className="text-sm text-muted">Sans compte · Gratuit · Tes données restent sur ton téléphone.</p>
      </div>
    </footer>
  );
}
