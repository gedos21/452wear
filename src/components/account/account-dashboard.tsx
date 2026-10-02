"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Heart } from "lucide-react";
import { FormNote, SectionTitle } from "./field";
import { AddressesSection } from "./addresses-section";
import { ProfileSection } from "./profile-section";
import { useAuth, type AuthUser } from "@/lib/auth";
import { useFavoriteProducts } from "@/components/product/catalog-provider";
import { useOrders, ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "orders", label: "Siparişlerim" },
  { key: "favorites", label: "Favorilerim" },
  { key: "addresses", label: "Adreslerim" },
  { key: "profile", label: "Hesap Bilgileri" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

/** Adres çubuğundaki `?bolum=` değerleri (ör. Google dönüşü). */
const SECTION_SLUGS: Record<string, SectionKey> = {
  siparisler: "orders",
  favoriler: "favorites",
  adresler: "addresses",
  "hesap-bilgileri": "profile",
};

export function sectionFromSlug(slug: string | null | undefined): SectionKey | undefined {
  return slug ? SECTION_SLUGS[slug] : undefined;
}

/** Hesap paneli. Kullanıcı bilgisi `useAuth().user`'dan gelir. */
export function AccountDashboard({
  user,
  onExitPreview,
  initialSection = "orders",
}: {
  user: AuthUser;
  /** Yalnızca geliştirme önizlemesinde dolu gelir. */
  onExitPreview?: () => void;
  initialSection?: SectionKey;
}) {
  const [section, setSection] = useState<SectionKey>(initialSection);
  const preview = Boolean(onExitPreview);
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
            {section === "addresses" && <AddressesSection preview={preview} />}
            {section === "profile" && <ProfileSection user={user} preview={preview} />}
          </motion.div>

          {note && <FormNote message={note} />}
        </div>
      </div>
    </div>
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
  const count = useFavoriteProducts().length;

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
