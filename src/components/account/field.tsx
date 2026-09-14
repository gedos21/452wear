"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Hesap formlarındaki tek alan: ince alt çizgi, kutu yok. */
export function Field({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  className,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="micro text-foreground/45">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="mt-2 h-11 w-full border-b border-border bg-transparent text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground"
      />
    </div>
  );
}

/** Backend bağlı değilken gösterilen dürüst bilgi satırı. */
export function NotConnectedNote({ message }: { message: string }) {
  return (
    <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground" role="status">
      {message}
    </p>
  );
}
