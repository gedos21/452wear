"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Field, FormNote } from "./field";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

/** Giriş / kayıt formları ve Google ile devam et. */
export function AuthForms({
  googleEnabled,
  initialNote = null,
}: {
  googleEnabled: boolean;
  /** Google dönüşünden gelen hata mesajı (varsa). */
  initialNote?: string | null;
}) {
  const { signIn, signUp, signInWithGoogle, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [note, setNote] = useState<string | null>(initialNote);
  const [pending, setPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setNote(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);

    if (mode === "signup" && password !== passwordAgain) {
      setNote("Şifreler eşleşmiyor.");
      return;
    }

    setPending(true);
    const result =
      mode === "signin"
        ? await signIn({ email, password })
        : await signUp({ firstName, lastName, email, password });
    setPending(false);

    if (!result.ok) setNote(result.message);
  }

  async function handleGoogle() {
    setNote(null);
    setPending(true);
    const result = await signInWithGoogle();
    // Başarılıysa sayfa Google'a yönlenir; buraya yalnızca hatada dönülür.
    if (!result.ok) {
      setPending(false);
      setNote(result.message);
    }
  }

  async function handleForgot() {
    setNote(null);
    if (!email.trim()) {
      setNote("Önce e-posta adresini yaz, sıfırlama bağlantısını oraya gönderelim.");
      return;
    }
    setPending(true);
    const result = await requestPasswordReset(email.trim());
    setPending(false);
    setNote(
      result.ok
        ? "Bu e-postaya kayıtlı bir hesap varsa şifre sıfırlama bağlantısını gönderdik. Gelen kutunu (ve gereksiz klasörünü) kontrol et."
        : result.message,
    );
  }

  return (
    <div className="max-w-sm">
      <div className="flex gap-7 border-b border-border/70">
        {(
          [
            { key: "signin", label: "Giriş Yap" },
            { key: "signup", label: "Hesap Oluştur" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchMode(tab.key)}
            aria-current={mode === tab.key}
            className={cn(
              "relative py-3 micro transition-colors",
              mode === tab.key
                ? "text-foreground"
                : "text-foreground/45 hover:text-foreground/80",
            )}
          >
            {tab.label}
            {mode === tab.key && (
              <motion.span
                layoutId="auth-tab-underline"
                className="absolute inset-x-0 -bottom-px h-px bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>

      {googleEnabled && (
        <div className="mt-8">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={pending}
            className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-full border border-foreground/20 px-8 micro transition-colors hover:border-foreground/60 disabled:opacity-60"
          >
            <GoogleMark />
            Google ile devam et
          </button>

          <div className="mt-8 flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-border/70" />
            <span className="micro text-foreground/35">ya da e-posta ile</span>
            <span className="h-px flex-1 bg-border/70" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={cn("space-y-6", googleEnabled ? "mt-6" : "mt-8")}>
        {mode === "signup" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Ad"
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
              required
            />
            <Field
              label="Soyad"
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
              required
            />
          </div>
        )}

        <Field
          label="E-posta"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        <Field
          label={mode === "signup" ? "Şifre (en az 8 karakter)" : "Şifre"}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          required
        />

        {mode === "signup" && (
          <Field
            label="Şifre tekrar"
            type="password"
            value={passwordAgain}
            onChange={setPasswordAgain}
            autoComplete="new-password"
            minLength={8}
            required
          />
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-13 items-center gap-2.5 rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
          >
            {mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
            <ArrowRight className="size-4" strokeWidth={1.8} />
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={handleForgot}
              disabled={pending}
              className="ml-6 micro text-foreground/45 underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Şifremi unuttum?
            </button>
          )}
        </div>

        {note && <FormNote message={note} />}
      </form>

      <p className="mt-10 text-[12px] leading-relaxed text-muted-foreground">
        {mode === "signup" ? "Hesap oluşturarak" : "Devam ederek"}{" "}
        <Link href="/kullanim-kosullari" className="underline underline-offset-2 hover:text-foreground">
          Kullanım Koşulları
        </Link>
        &apos;nı kabul etmiş olursun. Kişisel verilerinin nasıl işlendiğini{" "}
        <Link href="/kvkk" className="underline underline-offset-2 hover:text-foreground">
          KVKK Aydınlatma Metni
        </Link>
        &apos;nde bulabilirsin.
      </p>
    </div>
  );
}

/** Google'ın çok renkli "G" işareti (marka kuralı gereği renkleri sabit). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
