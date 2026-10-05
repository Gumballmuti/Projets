import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ icon = "info", title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line-strong bg-surface/60 px-6 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-soft text-accent">
        <Icon name={icon} />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
      {action}
    </div>
  );
}
