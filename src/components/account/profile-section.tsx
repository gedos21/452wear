"use client";

import { useEffect, useState } from "react";
import { Field, FormNote, SectionTitle } from "./field";
import { useAuth, type AuthUser, type SignInMethods } from "@/lib/auth";
import { validateProfile } from "@/lib/profile";

const BUTTON_PRIMARY =
  "inline-flex h-12 items-center rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-60";
const BUTTON_OUTLINE =
  "inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60 disabled:opacity-60";
const TEXT_ACTION =
  "micro text-foreground/45 transition-colors hover:text-foreground disabled:opacity-60";

/** Google ile yeniden girişten sonra bu bölüme dönülür. */
const PROFILE_URL = "/hesap?bolum=hesap-bilgileri";

/** Hesap Bilgileri: ad/soyad düzenleme, giriş yöntemleri, şifre ve hesap silme. */
export function ProfileSection({ user, preview = false }: { user: AuthUser; preview?: boolean }) {
  const { listSignInMethods } = useAuth();
  const [methods, setMethods] = useState<SignInMethods | null>(
    preview ? { google: false, password: true } : null,
  );
  const [methodsError, setMethodsError] = useState<string | null>(null);

  useEffect(() => {
    if (preview) return;
    let active = true;
    listSignInMethods().then((result) => {
      if (!active) return;
      if (result.ok) setMethods({ google: result.google, password: result.password });
      else setMethodsError(result.message);
    });
    return () => {
      active = false;
    };
    // listSignInMethods her render'da yeni; yalnızca bir kez okunur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  return (
    <div>
      <SectionTitle>HESAP BİLGİLERİ</SectionTitle>
      <NameEditor user={user} />
      <SignInMethodsRow methods={methods} error={methodsError} />
      <PasswordButton email={user.email} hasPassword={methods?.password ?? null} />
      <DeleteAccount hasPassword={methods?.password ?? null} />
    </div>
  );
}

function NameEditor({ user }: { user: AuthUser }) {
  const { updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validateProfile({ firstName, lastName });
    if (!check.ok) {
      setNote(check.message);
      return;
    }
    setPending(true);
    const result = await updateProfile({ firstName: check.firstName, lastName: check.lastName });
    setPending(false);
    if (!result.ok) {
      setNote(result.message);
      return;
    }
    setEditing(false);
    setNote("Bilgilerin güncellendi.");
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} noValidate className="mt-8 max-w-md space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Ad"
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
            maxLength={50}
            required
          />
          <Field
            label="Soyad"
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
            maxLength={50}
            required
          />
        </div>
        <p className="text-[13px] text-muted-foreground">
          E-posta adresin değiştirilemez.
        </p>
        <div className="flex items-center gap-5">
          <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
            Kaydet
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setNote(null);
              setFirstName(user.firstName);
              setLastName(user.lastName);
            }}
            className={TEXT_ACTION}
          >
            Vazgeç
          </button>
        </div>
        {note && <FormNote message={note} />}
      </form>
    );
  }

  return (
    <div className="mt-8 max-w-md">
      <dl className="divide-y divide-border/70 border-y border-border/70">
        {[
          { label: "Ad", value: user.firstName },
          { label: "Soyad", value: user.lastName },
          { label: "E-posta", value: user.email },
        ].map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-4">
            <dt className="micro text-foreground/45">{row.label}</dt>
            <dd className="min-w-0 truncate text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => {
          setFirstName(user.firstName);
          setLastName(user.lastName);
          setNote(null);
          setEditing(true);
        }}
        className={`mt-5 ${TEXT_ACTION}`}
      >
        Ad / Soyad Düzenle
      </button>
      {note && <FormNote message={note} />}
    </div>
  );
}

function SignInMethodsRow({
  methods,
  error,
}: {
  methods: SignInMethods | null;
  error: string | null;
}) {
  const labels = methods
    ? [methods.google && "Google hesabı bağlı", methods.password && "Şifre"].filter(Boolean)
    : [];

  return (
    <div className="mt-10 max-w-md">
      <p className="micro text-foreground/45">Giriş Yöntemleri</p>
      {error ? (
        <p className="mt-3 text-[13px] text-muted-foreground">{error}</p>
      ) : methods === null ? (
        <div className="mt-3 h-5" aria-busy="true" />
      ) : (
        <ul className="mt-3 space-y-1.5">
          {labels.map((label) => (
            <li key={String(label)} className="flex items-center gap-2.5 text-sm">
              <span aria-hidden className="size-1.5 rounded-full bg-brand" />
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasswordButton({ email, hasPassword }: { email: string; hasPassword: boolean | null }) {
  const { requestPasswordReset } = useAuth();
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Yalnızca Google ile giren hesap da e-postadaki bağlantıyla şifre belirleyebilir.
  const label = hasPassword === false ? "Şifre Belirle" : "Şifre Değiştir";

  return (
    <div>
      <button
        type="button"
        disabled={pending || hasPassword === null}
        onClick={async () => {
          setPending(true);
          const result = await requestPasswordReset(email);
          setPending(false);
          setNote(
            result.ok
              ? `Şifre belirleme bağlantısını ${email} adresine gönderdik.`
              : result.message,
          );
        }}
        className={`mt-8 ${BUTTON_OUTLINE}`}
      >
        {label}
      </button>
      {note && <FormNote message={note} />}
    </div>
  );
}

/** Onay için yazılması gereken kelime. Türkçe klavyesi olmayan "SIL" da yazabilir. */
const CONFIRM_WORD = "SİL";

function isConfirmed(value: string) {
  const upper = value.trim().toLocaleUpperCase("tr-TR");
  return upper === CONFIRM_WORD || upper === "SIL";
}

function DeleteAccount({ hasPassword }: { hasPassword: boolean | null }) {
  const { deleteAccount, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [pending, setPending] = useState(false);

  const ready = isConfirmed(confirmText) && (hasPassword === false || password.length > 0);

  function close() {
    setOpen(false);
    setPassword("");
    setConfirmText("");
    setNote(null);
    setNeedsReauth(false);
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || hasPassword === null) return;
    setNote(null);
    setPending(true);
    const result = await deleteAccount(hasPassword ? password : undefined);
    if (result.ok) {
      // Tam yeniden yükleme: tüm istemci durumu (favoriler, oturum) sıfırlanır.
      window.location.replace("/hesap?silindi=1");
      return;
    }
    setPending(false);
    setNeedsReauth(result.code === "SESSION_EXPIRED");
    setNote(
      result.code === "SESSION_EXPIRED"
        ? "Güvenliğin için, hesabını silmeden önce Google ile yeniden giriş yapman gerekiyor. Giriş yaptıktan sonra buraya dönüp silme işlemini tamamlayabilirsin."
        : result.message,
    );
  }

  return (
    <div className="mt-16 max-w-md border-t border-border/70 pt-8">
      <p className="micro text-foreground/45">Hesabımı Sil</p>

      {!open ? (
        <>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Hesabını ve ona bağlı tüm bilgileri kalıcı olarak silebilirsin.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 micro text-brand underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Hesabımı Sil
          </button>
        </>
      ) : (
        <form onSubmit={handleDelete} noValidate className="mt-4 space-y-6">
          <div className="rounded-product bg-muted px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
            <p className="text-foreground">Bu işlem geri alınamaz.</p>
            <p className="mt-2">
              Hesabın, kayıtlı adreslerin, favorilerin ve giriş bilgilerin
              kalıcı olarak silinir; tüm cihazlardaki oturumların kapanır.
              E-posta bültenine abone olduysan bu abonelik hesabından ayrı
              tutulur; ayrılmak için bize yazabilirsin.
            </p>
          </div>

          {hasPassword && (
            <Field
              label="Şifren"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
          )}

          <Field
            label={`Onaylamak için ${CONFIRM_WORD} yaz`}
            value={confirmText}
            onChange={setConfirmText}
            autoComplete="off"
            maxLength={10}
            required
          />

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="submit"
              disabled={!ready || pending || hasPassword === null}
              className="inline-flex h-12 items-center rounded-full bg-brand px-7 micro text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Hesabımı Kalıcı Olarak Sil
            </button>
            <button type="button" onClick={close} disabled={pending} className={TEXT_ACTION}>
              Vazgeç
            </button>
          </div>

          {note && <FormNote message={note} />}

          {needsReauth && (
            <button
              type="button"
              onClick={async () => {
                const result = await signInWithGoogle(PROFILE_URL);
                if (!result.ok) setNote(result.message);
              }}
              className={BUTTON_OUTLINE}
            >
              Google ile Yeniden Giriş Yap
            </button>
          )}
        </form>
      )}
    </div>
  );
}
