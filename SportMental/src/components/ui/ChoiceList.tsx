"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type Choice<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

type ChoiceListProps<T extends string> = {
  legend: string;
  /** Masque visuellement la légende (elle reste lue par les lecteurs d'écran). */
  hideLegend?: boolean;
  options: ReadonlyArray<Choice<T>>;
  value: T | null;
  onChange: (value: T) => void;
  layout?: "list" | "chips" | "grid";
};

/** Choix unique, accessible (boutons radio natifs stylés). */
export function ChoiceList<T extends string>({
  legend,
  hideLegend,
  options,
  value,
  onChange,
  layout = "list",
}: ChoiceListProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className={cn("mb-3 font-semibold text-ink", hideLegend && "sr-only")}>{legend}</legend>
      <div
        className={cn(
          layout === "list" && "flex flex-col gap-2",
          layout === "chips" && "flex flex-wrap gap-2",
          layout === "grid" && "grid grid-cols-2 gap-2",
        )}
      >
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2.5 transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                checked
                  ? "border-primary bg-soft text-ink"
                  : "border-line bg-surface text-ink hover:border-line-strong",
                layout === "chips" && "rounded-full px-4",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex-1">
                <span className="block font-medium">{option.label}</span>
                {option.hint && <span className="block text-sm text-muted">{option.hint}</span>}
              </span>
              {checked && layout !== "chips" && (
                <Icon name="check" size={20} className="text-accent" />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
