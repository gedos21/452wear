"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { isValidEmail, type SubscribeResult } from "@/lib/newsletter";
import { subscribeToNewsletter } from "@/lib/server/newsletter-action";
import { cn } from "@/lib/utils";

const MESSAGES = {
  ok: "Teşekkürler, aramıza hoş geldin.",
  invalid: "Geçerli bir e-posta adresi yaz.",
  consent: "Katılmak için aşağıdaki izni onaylaman gerekiyor.",
  "rate-limited": "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.",
  "not-configured":
    "Bültenimiz çok yakında açılıyor. E-postan şimdilik kaydedilmedi.",
  error: "Bir sorun oluştu, lütfen tekrar dene.",
} as const;

type Status = keyof typeof MESSAGES;

/**
 * "Bize Katıl" e-posta formu. Kayıt bir server action ile yapılır
 * (lib/server/newsletter-action). Açık rıza kutusu zorunlu ve varsayılan
 * olarak işaretsiz; sunucu da ayrıca kontrol eder.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setStatus("invalid");
    if (!consent) return setStatus("consent");

    setPending(true);
    let result: SubscribeResult;
    try {
      result = await subscribeToNewsletter({
        email,
        consent,
        website,
        source: "ana-sayfa",
      });
    } catch {
      result = { ok: false, reason: "error" };
    }
    setPending(false);
    setStatus(result.ok ? "ok" : result.reason);
    if (result.ok) {
      setEmail("");
      setConsent(false);
    }
  };

  const isError = status !== null && status !== "ok";

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">E-posta adresin</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus(null);
            }}
            placeholder="E-posta adresin"
            aria-invalid={status === "invalid" || undefined}
            aria-describedby="newsletter-status"
            className="h-12 w-full rounded-full border border-foreground/15 bg-white px-5 font-sf text-[15px] outline-none transition-colors placeholder:text-foreground/40 focus:border-foreground/50"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-12 shrink-0 rounded-full bg-foreground px-6 font-sf text-[13px] font-bold uppercase tracking-[0.04em] text-background transition-opacity hover:opacity-85 disabled:opacity-50 sm:px-8"
        >
          Katıl
        </button>
      </div>

      {/* Bal küpü: ekranda ve yardımcı teknolojide yok; yalnızca botlar doldurur. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Web sitesi
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {/* Açık rıza (ticari elektronik ileti). Varsayılan olarak işaretsiz. */}
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (status === "consent") setStatus(null);
          }}
          required
          aria-invalid={status === "consent" || undefined}
          aria-describedby="newsletter-status"
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "mt-px grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
            consent
              ? "border-foreground bg-foreground text-background"
              : status === "consent"
                ? "border-foreground"
                : "border-foreground/25",
          )}
        >
          {consent && <Check className="size-3" strokeWidth={3} />}
        </span>
        <span className="font-sf text-[12.5px] leading-relaxed text-foreground/60">
          Yeni ürün, kampanya ve fırsat duyurularının e-posta adresime ticari
          elektronik ileti olarak gönderilmesine açık rıza veriyorum. Bu izni
          dilediğim zaman geri alabilirim. Ayrıntılar:{" "}
          <Link
            href="/kvkk"
            className="underline underline-offset-2 hover:text-foreground"
          >
            KVKK Aydınlatma Metni
          </Link>
          .
        </span>
      </label>

      <p
        id="newsletter-status"
        aria-live="polite"
        className={cn(
          "mt-3 min-h-5 font-sf text-[13px]",
          isError ? "font-semibold text-foreground" : "text-foreground/60",
        )}
      >
        {status ? MESSAGES[status] : null}
      </p>
    </form>
  );
}
