"use client";

import { useState } from "react";
import { AuthForms } from "./auth-forms";
import { AccountDashboard } from "./account-dashboard";
import { useAuth, type AuthUser } from "@/lib/auth";

/**
 * Hesap ekranının kökü: oturum durumuna göre giriş formunu ya da paneli gösterir.
 *
 * Auth bağlı olmadığı için panel normalde erişilemez. Tasarımın gözden
 * geçirilebilmesi adına YALNIZCA geliştirmede bir önizleme anahtarı var;
 * üretim derlemesinde bu düğme hiç render edilmez ve panel açılamaz.
 */

const PREVIEW_ENABLED = process.env.NODE_ENV !== "production";

/** Önizlemede gösterilen örnek kullanıcı — gerçek bir hesap değil. */
const PREVIEW_USER: AuthUser = {
  firstName: "Ad",
  lastName: "Soyad",
  email: "ornek@452wear.com",
};

export function AccountView() {
  const { status, user } = useAuth();
  const [preview, setPreview] = useState(false);

  const signedIn = status === "signed-in" && user !== null;

  if (signedIn) return <AccountDashboard user={user} />;

  if (preview && PREVIEW_ENABLED) {
    return (
      <div>
        <div className="mb-10 rounded-product bg-muted px-5 py-4">
          <p className="micro text-brand">Önizleme</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Kimlik doğrulama bağlı değil. Buradaki ad, e-posta ve içerikler
            tasarımı görebilmek için konulmuş örneklerdir; gerçek bir hesap
            değildir.
          </p>
        </div>
        <AccountDashboard
          user={PREVIEW_USER}
          onExitPreview={() => setPreview(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <AuthForms />

      {PREVIEW_ENABLED && (
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="mt-16 micro text-foreground/35 underline underline-offset-4 transition-colors hover:text-foreground/70"
        >
          Panel önizlemesi (geliştirme)
        </button>
      )}
    </div>
  );
}
