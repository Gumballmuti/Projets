"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-2xl border-2 border-line-strong bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/80 focus-visible:border-focus";

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: FieldShellProps & ComponentProps<"input">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint || error ? `${fieldId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="font-medium text-ink">
        {label}
      </label>
      <input
        id={fieldId}
        aria-describedby={hintId}
        aria-invalid={error ? true : undefined}
        className={inputClass}
        {...props}
      />
      {(hint || error) && (
        <p id={hintId} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: FieldShellProps & ComponentProps<"textarea">) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint || error ? `${fieldId}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="font-medium text-ink">
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={3}
        aria-describedby={hintId}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, "resize-y")}
        {...props}
      />
      {(hint || error) && (
        <p id={hintId} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
