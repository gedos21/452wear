"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { cn } from "@/lib/utils";

const MESSAGES = {
  ok: "Teşekkürler, aramıza hoş geldin.",
  invalid: "Geçerli bir e-posta adresi yaz.",
  "not-configured":
    "Bültenimiz çok yakında açılıyor. E-postan şimdilik kaydedilmedi.",
  error: "Bir sorun oluştu, lütfen tekrar dene.",
} as const;

/** "Bize Katıl" e-posta formu. Gönderim lib/newsletter üzerinden yapılır. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<keyof typeof MESSAGES | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const result = await subscribeToNewsletter(email);
    setPending(false);
    setStatus(result.ok ? "ok" : result.reason);
    if (result.ok) setEmail("");
  };

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
      <p
        id="newsletter-status"
        aria-live="polite"
        className={cn(
          "mt-3 min-h-5 font-sf text-[13px]",
          status === "invalid" || status === "error"
            ? "font-semibold text-foreground"
            : "text-foreground/60",
        )}
      >
        {status ? MESSAGES[status] : null}
      </p>
    </form>
  );
}
