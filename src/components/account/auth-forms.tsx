"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Field, NotConnectedNote } from "./field";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

/**
 * Giriş / kayıt formları. Gönderim sonucunu doğrudan auth arayüzünden alır;
 * altyapı bağlı olmadığı için kullanıcıya sahte başarı değil, gerçek durum
 * gösterilir.
 */
export function AuthForms() {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [note, setNote] = useState<string | null>(null);
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
          label="Şifre"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
        />

        {mode === "signup" && (
          <Field
            label="Şifre tekrar"
            type="password"
            value={passwordAgain}
            onChange={setPasswordAgain}
            autoComplete="new-password"
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
              onClick={async () => {
                const result = await requestPasswordReset(email);
                if (!result.ok) setNote(result.message);
              }}
              className="ml-6 micro text-foreground/45 underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Şifremi unuttum?
            </button>
          )}
        </div>

        {note && <NotConnectedNote message={note} />}
      </form>
    </div>
  );
}
