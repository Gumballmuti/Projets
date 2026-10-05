import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

type NoticeProps = {
  tone?: "info" | "care";
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: IconName;
};

export function Notice({ tone = "info", title, children, className, icon }: NoticeProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-sm",
        tone === "info" && "border-line bg-soft text-ink",
        tone === "care" && "border-line-strong bg-surface text-ink",
        className,
      )}
    >
      <Icon
        name={icon ?? (tone === "care" ? "heart" : "info")}
        size={20}
        className="mt-0.5 text-accent"
      />
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
