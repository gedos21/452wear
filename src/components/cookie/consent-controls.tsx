"use client";

import { useState } from "react";
import { CONSENT_CATEGORIES, useCookieConsent } from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";

/** Sade anahtar. Zorunlu kategoride kapalı (disabled) ve açık görünür. */
function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
        checked ? "bg-foreground" : "bg-foreground/15",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-4 rounded-full bg-background transition-[left]",
          checked ? "left-5" : "left-1",
        )}
      />
    </button>
  );
}

/**
 * Kategori listesi + kaydetme eylemleri. Hem Çerez Tercihleri sayfası hem de
 * banner'ın "Tercihleri Yönet" görünümü bunu kullanır.
 */
export function ConsentControls({
  onDone,
  compact = false,
}: {
  onDone?: () => void;
  compact?: boolean;
}) {
  const { consent, acceptAll, rejectAll, save } = useCookieConsent();

  const [draft, setDraft] = useState({
    analytics: consent.analytics,
    functional: consent.functional,
    marketing: consent.marketing,
  });

  const set = (key: keyof typeof draft) => (value: boolean) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <ul className={cn("divide-y divide-border/70", compact && "text-sm")}>
        {CONSENT_CATEGORIES.map((category) => {
          const checked =
            category.key === "necessary"
              ? true
              : draft[category.key as keyof typeof draft];

          return (
            <li
              key={category.key}
              className={cn("flex items-start justify-between gap-6", compact ? "py-4" : "py-5")}
            >
              <div className="min-w-0">
                <p className="micro">{category.label}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <Toggle
                checked={checked}
                disabled={category.required}
                label={category.label}
                onChange={
                  category.required
                    ? () => {}
                    : set(category.key as keyof typeof draft)
                }
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            save(draft);
            onDone?.();
          }}
          className="inline-flex h-12 items-center rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
        >
          Tercihleri Kaydet
        </button>
        <button
          type="button"
          onClick={() => {
            acceptAll();
            setDraft({ analytics: true, functional: true, marketing: true });
            onDone?.();
          }}
          className="inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
        >
          Tümünü Kabul Et
        </button>
        <button
          type="button"
          onClick={() => {
            rejectAll();
            setDraft({ analytics: false, functional: false, marketing: false });
            onDone?.();
          }}
          className="inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
        >
          Tümünü Reddet
        </button>
      </div>
    </div>
  );
}
