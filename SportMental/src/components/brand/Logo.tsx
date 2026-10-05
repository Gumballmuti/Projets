import { cn } from "@/lib/cn";

type LogoProps = {
  size?: number;
  withText?: boolean;
  className?: string;
};

/**
 * Logo Sport Mental : une balle ronde neutre, traversée d'ondes concentriques
 * (respiration qui se pose, cible qui se resserre). Lisible dès 24 px.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="32" cy="32" r="31" fill="#1f5f3f" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#bfe8d0" strokeWidth="4.5" />
      <circle cx="32" cy="32" r="11" fill="none" stroke="#7fd3a8" strokeWidth="4.5" />
      <circle cx="32" cy="32" r="4" fill="#ffffff" />
      <path
        d="M14 15.5a24 24 0 0 1 12-6.8"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ size = 32, withText = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withText && (
        <span className="text-lg font-semibold tracking-tight text-ink">Sport Mental</span>
      )}
    </span>
  );
}
