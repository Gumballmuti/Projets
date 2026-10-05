import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ title, subtitle, backHref, backLabel = "Retour" }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-2">
      {backHref && (
        <Link
          href={backHref}
          className="-ml-2 inline-flex min-h-12 w-fit items-center gap-1 rounded-xl px-2 font-medium text-accent hover:bg-soft"
        >
          <Icon name="back" size={20} />
          {backLabel}
        </Link>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="text-base leading-relaxed text-muted">{subtitle}</p>}
    </header>
  );
}
