"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type RatingScaleProps = {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
};

/** Note de 1 à 10 en un tap (boutons radio). */
export function RatingScale({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  lowLabel,
  highLabel,
}: RatingScaleProps) {
  const name = useId();
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-ink">
        {label}
        {value !== null && <span className="ml-2 font-normal text-muted">({value}/{max})</span>}
      </legend>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {values.map((v) => {
          const checked = v === value;
          return (
            <label
              key={v}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 text-base font-semibold transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                checked
                  ? "border-primary bg-primary text-on-primary"
                  : "border-line bg-surface text-ink hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name={name}
                value={v}
                checked={checked}
                onChange={() => onChange(v)}
                className="sr-only"
                aria-label={`${v} sur ${max}`}
              />
              {v}
            </label>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-sm text-muted">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </fieldset>
  );
}
