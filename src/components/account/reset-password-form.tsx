"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Field, FormNote } from "./field";
import { useAuth } from "@/lib/auth";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="max-w-sm">
        <p className="text-sm text-muted-foreground">
          Bu bağlantı geçersiz ya da süresi dolmuş. Giriş sayfasındaki
          &quot;Şifremi unuttum?&quot; ile yeni bir bağlantı isteyebilirsin.
        </p>
        <AccountLink />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-sm">
        <p className="text-sm text-muted-foreground">
          Şifren güncellendi. Güvenliğin için tüm cihazlardaki oturumların
          kapatıldı; yeni şifrenle giriş yapabilirsin.
        </p>
        <AccountLink />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    if (password !== passwordAgain) {
      setNote("Şifreler eşleşmiyor.");
      return;
    }
    setPending(true);
    const result = await resetPassword(token!, password);
    setPending(false);
    if (result.ok) setDone(true);
    else setNote(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-6">
      <Field
        label="Yeni şifre (en az 8 karakter)"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        label="Yeni şifre tekrar"
        type="password"
        value={passwordAgain}
        onChange={setPasswordAgain}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-13 items-center gap-2.5 rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
        >
          Şifreyi Kaydet
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>
      {note && <FormNote message={note} />}
    </form>
  );
}

function AccountLink() {
  return (
    <Link
      href="/hesap"
      className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
    >
      Giriş Sayfasına Git
      <ArrowRight className="size-4" strokeWidth={1.8} />
    </Link>
  );
}
