"use client";

import { useState } from "react";
import { AuthForms } from "./auth-forms";
import { AccountDashboard, sectionFromSlug } from "./account-dashboard";
import { oauthErrorMessage, useAuth, type AuthUser } from "@/lib/auth";

/**
 * Hesap ekranının kökü: oturum durumuna göre giriş formunu ya da paneli gösterir.
 *
 * Tasarımın oturum açmadan gözden geçirilebilmesi için YALNIZCA geliştirmede
 * bir önizleme anahtarı var; üretim derlemesinde bu düğme hiç render edilmez.
 */

const PREVIEW_ENABLED = process.env.NODE_ENV !== "production";

/** Önizlemede gösterilen örnek kullanıcı — gerçek bir hesap değil. */
const PREVIEW_USER: AuthUser = {
  id: "onizleme",
  firstName: "Ad",
  lastName: "Soyad",
  email: "ornek@452wear.com",
};

export function AccountView({
  googleEnabled,
  oauthError,
  section = null,
  deleted = false,
}: {
  googleEnabled: boolean;
  /** Google dönüşündeki `?error=` kodu. */
  oauthError: string | null;
  /** `?bolum=`: panelde açılacak bölüm (ör. "hesap-bilgileri"). */
  section?: string | null;
  /** `?silindi=1`: hesap az önce silindi. */
  deleted?: boolean;
}) {
  const { status, user } = useAuth();
  const [preview, setPreview] = useState(false);

  // Oturum sorgusu bitene kadar formu göstermiyoruz; giriş yapmış kullanıcı
  // bir an giriş formunu görmesin.
  if (status === "loading") {
    return <div className="h-80" aria-busy="true" />;
  }

  if (status === "signed-in" && user) {
    return <AccountDashboard user={user} initialSection={sectionFromSlug(section)} />;
  }

  if (preview && PREVIEW_ENABLED) {
    return (
      <div>
        <div className="mb-10 rounded-product bg-muted px-5 py-4">
          <p className="micro text-brand">Önizleme</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Buradaki ad, e-posta ve içerikler tasarımı görebilmek için
            konulmuş örneklerdir; gerçek bir hesap değildir.
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
      <AuthForms
        googleEnabled={googleEnabled}
        initialNote={
          deleted
            ? "Hesabın ve ona bağlı tüm bilgiler kalıcı olarak silindi."
            : oauthErrorMessage(oauthError)
        }
      />

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
