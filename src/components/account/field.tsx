"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hesap formlarındaki tek alan: ince alt çizgi, kutu yok. */
export function Field({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  maxLength,
  inputMode,
  placeholder,
  invalid,
  className,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  /** Sunucu bu alanı hatalı bulduysa: alt çizgi koyulaşır, ekran okuyucuya bildirilir. */
  invalid?: boolean;
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
        minLength={minLength}
        maxLength={maxLength}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={cn(
          "mt-2 h-11 w-full border-b bg-transparent text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground",
          invalid ? "border-foreground" : "border-border",
        )}
      />
    </div>
  );
}

/** Form altındaki durum/hata satırı. */
export function FormNote({ message }: { message: string }) {
  return (
    <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground" role="status">
      {message}
    </p>
  );
}

/** Panel bölümlerinin başlığı. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
      {children}
    </h2>
  );
}

/** Hesap formlarındaki onay kutusu (filtre çekmecesindekiyle aynı görünüm). */
export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
          checked ? "border-foreground bg-foreground" : "border-foreground/25",
        )}
      >
        {checked && <Check className="size-3 text-background" strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}
