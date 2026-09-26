"use client";

import { useState } from "react";
import { ChevronRight, Ruler } from "lucide-react";
import {
  HEIGHT_RANGE,
  PREFERENCE_LABELS,
  WEIGHT_RANGE,
  isValidProfile,
  type FitPreference,
  type SizeProfile,
} from "@/lib/size-profile";
import { cn } from "@/lib/utils";
import type { ApparelSize } from "@/types/product";

/** Önerilen bedenin bu üründeki durumu. */
export type RecommendationState =
  | { kind: "ok"; size: ApparelSize }
  | { kind: "soldOut"; size: ApparelSize }
  | { kind: "notOffered"; size: ApparelSize };

/**
 * "Sana uyan bedeni bul" kutusu: profil yoksa davet, girilirken form,
 * girildiyse bu ürün için önerilen beden. Profil tüm ürünlerde ortak.
 */
export function SizeFinder({
  profile,
  recommendation,
  onSave,
  onOpenGuide,
}: {
  profile: SizeProfile | null;
  recommendation: RecommendationState | null;
  onSave: (profile: SizeProfile) => void;
  onOpenGuide: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const footerLink =
    "text-[13px] font-semibold text-foreground/55 transition-colors hover:text-foreground";

  return (
    <div className="rounded-2xl border border-foreground/10 bg-background font-sf">
      {editing ? (
        <ProfileForm
          initial={profile}
          onCancel={() => setEditing(false)}
          onSave={(p) => {
            onSave(p);
            setEditing(false);
          }}
        />
      ) : (
        <div className="flex items-center gap-4 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-dashed border-foreground/20 text-foreground/60">
            <Ruler className="size-[18px]" strokeWidth={1.8} />
          </span>
          {profile && recommendation ? (
            <div className="min-w-0" role="status">
              <p className="text-[15px] font-semibold leading-snug">
                Sana önerilen beden:{" "}
                <span className="font-black text-brand">
                  {recommendation.size}
                </span>
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-foreground/55">
                {recommendation.kind === "ok" &&
                  `${profile.height} cm · ${profile.weight} kg · ${PREFERENCE_LABELS[profile.preference]}`}
                {recommendation.kind === "soldOut" &&
                  `${recommendation.size} bu renkte tükendi; yakın bedenlere bak.`}
                {recommendation.kind === "notOffered" &&
                  `Bu üründe ${recommendation.size} yok; beden tablosuna bak.`}
              </p>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-snug">
                Sana uyan bedeni bul
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-foreground/55">
                Boy ve kilonu gir, her üründe geçerli.
              </p>
            </div>
          )}
        </div>
      )}

      {!editing && (
        <div className="flex items-center justify-between gap-4 border-t border-foreground/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[13px] font-bold underline underline-offset-4"
          >
            {profile ? "Bilgilerimi düzenle" : "Bilgilerimi gir"}
          </button>
          <button
            type="button"
            onClick={onOpenGuide}
            className={cn(footerLink, "inline-flex items-center gap-0.5")}
          >
            Beden tablosu
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SizeProfile | null;
  onSave: (p: SizeProfile) => void;
  onCancel: () => void;
}) {
  const [height, setHeight] = useState(initial ? String(initial.height) : "");
  const [weight, setWeight] = useState(initial ? String(initial.weight) : "");
  const [preference, setPreference] = useState<FitPreference>(
    initial?.preference ?? "normal",
  );
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      height: Math.round(Number(height)),
      weight: Math.round(Number(weight)),
      preference,
    };
    if (!isValidProfile(next)) {
      setError(
        `Boy ${HEIGHT_RANGE.min}–${HEIGHT_RANGE.max} cm, kilo ${WEIGHT_RANGE.min}–${WEIGHT_RANGE.max} kg arasında olmalı.`,
      );
      return;
    }
    onSave(next);
  }

  const input =
    "h-11 w-full rounded-full border border-foreground/15 bg-transparent px-4 pr-11 text-[15px] font-semibold outline-none tabular-nums focus-visible:border-foreground/50";

  return (
    <form onSubmit={submit} className="p-4" noValidate>
      <p className="text-[15px] font-semibold">Boy ve kilonu gir</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <label className="relative">
          <span className="sr-only">Boy (cm)</span>
          <input
            autoFocus
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value.replace(/\D/g, ""))}
            placeholder="Boy"
            maxLength={3}
            className={input}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-foreground/45">
            cm
          </span>
        </label>
        <label className="relative">
          <span className="sr-only">Kilo (kg)</span>
          <input
            inputMode="numeric"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/\D/g, ""))}
            placeholder="Kilo"
            maxLength={3}
            className={input}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-foreground/45">
            kg
          </span>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-[13px] font-semibold text-foreground/55">
          Nasıl giymeyi seversin?
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-full bg-muted p-1">
          {(Object.keys(PREFERENCE_LABELS) as FitPreference[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={preference === key}
              onClick={() => setPreference(key)}
              className={cn(
                "h-9 rounded-full text-[13px] font-semibold transition-colors",
                preference === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/55 hover:text-foreground",
              )}
            >
              {PREFERENCE_LABELS[key]}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="mt-3 text-[13px] font-semibold text-brand" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="h-11 flex-1 rounded-full bg-foreground text-[13px] font-bold uppercase tracking-[0.05em] text-background transition-colors hover:bg-brand"
        >
          Bedenimi bul
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-3 text-[13px] font-semibold text-foreground/55 transition-colors hover:text-foreground"
        >
          Vazgeç
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-snug text-foreground/40">
        Bilgilerin yalnızca bu tarayıcıda saklanır, bize gönderilmez.
      </p>
    </form>
  );
}
