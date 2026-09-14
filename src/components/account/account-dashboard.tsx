"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Heart } from "lucide-react";
import { Field, NotConnectedNote } from "./field";
import { useAuth, type AuthUser } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { useOrders, ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "orders", label: "Siparişlerim" },
  { key: "favorites", label: "Favorilerim" },
  { key: "addresses", label: "Adreslerim" },
  { key: "profile", label: "Hesap Bilgileri" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

/**
 * Hesap paneli. Kullanıcı bilgisi dışarıdan gelir; gerçek auth bağlandığında
 * `useAuth().user` doğrudan buraya beslenecek, bileşen değişmeyecek.
 */
export function AccountDashboard({
  user,
  onExitPreview,
}: {
  user: AuthUser;
  /** Yalnızca geliştirme önizlemesinde dolu gelir. */
  onExitPreview?: () => void;
}) {
  const [section, setSection] = useState<SectionKey>("orders");
  const { signOut } = useAuth();
  const [note, setNote] = useState<string | null>(null);

  async function handleSignOut() {
    if (onExitPreview) {
      onExitPreview();
      return;
    }
    const result = await signOut();
    if (!result.ok) setNote(result.message);
  }

  return (
    <div>
      {/* Profil özeti */}
      <div className="border-b border-border/70 pb-8">
        <p className="text-lg font-medium">
          {user.firstName} {user.lastName}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        {/* Navigasyon — masaüstünde solda, mobilde üstte yatay */}
        <nav className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {SECTIONS.map((item) => {
            const active = item.key === section;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "relative shrink-0 py-2 text-left micro transition-colors lg:py-2.5",
                  active
                    ? "text-foreground"
                    : "text-foreground/45 hover:text-foreground/80",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="account-nav-marker"
                    className="absolute inset-x-0 -bottom-px h-px bg-brand lg:inset-x-auto lg:-left-3 lg:bottom-auto lg:top-1/2 lg:h-4 lg:w-px lg:-translate-y-1/2"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 py-2 text-left micro text-foreground/45 transition-colors hover:text-foreground lg:mt-6 lg:py-2.5"
          >
            {onExitPreview ? "Önizlemeden Çık" : "Çıkış Yap"}
          </button>
        </nav>

        <div className="min-w-0">
          {/* Tek eleman, `key` ile yeniden mount: giriş animasyonu oynar.
              AnimatePresence + mode="wait" kullanmıyoruz — bölüm değişimini
              çıkış animasyonunun bitmesine bağımlı kılıyordu. */}
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            {section === "orders" && <OrdersSection />}
            {section === "favorites" && <FavoritesSection />}
            {section === "addresses" && <AddressesSection />}
            {section === "profile" && <ProfileSection user={user} />}
          </motion.div>

          {note && <NotConnectedNote message={note} />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
      {children}
    </h2>
  );
}

function OrdersSection() {
  const { orders } = useOrders();

  if (orders.length === 0) {
    return (
      <div>
        <SectionTitle>SİPARİŞLERİM</SectionTitle>
        <p className="mt-8 text-sm text-muted-foreground">
          Henüz bir siparişin yok.
        </p>
        <Link
          href="/magaza"
          className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
        >
          Mağazaya Git
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>SİPARİŞLERİM</SectionTitle>
      <ul className="mt-8 divide-y divide-border/70 border-y border-border/70">
        {orders.map((order) => (
          <li key={order.id} className="py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{order.id}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(order.placedAt))}
                </p>
              </div>
              <span className="micro text-foreground/45">
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>

            <ul className="mt-4 space-y-1.5">
              {order.lines.map((line) => (
                <li
                  key={`${line.productId}-${line.size}-${line.color}`}
                  className="text-[13px] text-muted-foreground"
                >
                  {line.name} · {line.color} / {line.size} · {line.qty} adet
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm font-medium">
              {formatPrice(order.total, order.currency)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FavoritesSection() {
  const { count } = useFavorites();

  return (
    <div>
      <SectionTitle>FAVORİLERİM</SectionTitle>
      <p className="mt-8 text-sm text-muted-foreground">
        {count === 0
          ? "Henüz favorine bir şey eklemedin."
          : `${count} ürün favorilerinde.`}
      </p>
      <Link
        href="/favoriler"
        className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
      >
        <Heart className="size-4" strokeWidth={1.8} />
        Favorileri Gör
        <ArrowRight className="size-4" strokeWidth={1.8} />
      </Link>
    </div>
  );
}

function AddressesSection() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <SectionTitle>ADRESLERİM</SectionTitle>
      <p className="mt-8 text-sm text-muted-foreground">
        Kayıtlı adresin yok.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
        >
          Adres Ekle
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Adres servisi bağlı değil: kaydediyormuş gibi davranmıyoruz.
            setNote("Adres kaydı henüz bir servise bağlı değil.");
          }}
          className="mt-8 max-w-md space-y-6"
        >
          <p className="micro text-foreground/45">Teslimat Adresi</p>
          <Field label="Ad Soyad" value={form.fullName} onChange={set("fullName")} autoComplete="name" />
          <Field label="Adres" value={form.address} onChange={set("address")} autoComplete="street-address" />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Şehir" value={form.city} onChange={set("city")} autoComplete="address-level1" />
            <Field label="İlçe" value={form.district} onChange={set("district")} autoComplete="address-level2" />
          </div>
          <Field label="Posta Kodu" value={form.postalCode} onChange={set("postalCode")} autoComplete="postal-code" />

          <div className="flex items-center gap-5 pt-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-full bg-foreground px-7 micro text-background transition-colors hover:bg-foreground/90"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setNote(null);
              }}
              className="micro text-foreground/45 transition-colors hover:text-foreground"
            >
              Vazgeç
            </button>
          </div>

          {note && <NotConnectedNote message={note} />}
        </form>
      )}
    </div>
  );
}

function ProfileSection({ user }: { user: AuthUser }) {
  const { requestPasswordReset } = useAuth();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div>
      <SectionTitle>HESAP BİLGİLERİ</SectionTitle>

      <dl className="mt-8 max-w-md divide-y divide-border/70 border-y border-border/70">
        {[
          { label: "Ad", value: user.firstName },
          { label: "Soyad", value: user.lastName },
          { label: "E-posta", value: user.email },
        ].map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-4">
            <dt className="micro text-foreground/45">{row.label}</dt>
            <dd className="text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={async () => {
          const result = await requestPasswordReset(user.email);
          if (!result.ok) setNote(result.message);
        }}
        className="mt-8 inline-flex h-12 items-center rounded-full border border-foreground/20 px-7 micro transition-colors hover:border-foreground/60"
      >
        Şifre Değiştir
      </button>

      {note && <NotConnectedNote message={note} />}
    </div>
  );
}
