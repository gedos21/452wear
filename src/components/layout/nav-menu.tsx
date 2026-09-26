"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_ITEMS, type MenuLink } from "./nav-links";
import { useCatalog } from "@/components/product/catalog-provider";
import { formatPrice } from "@/lib/format";
import {
  matchesCategory,
  productNameParts,
  variantSummary,
  type CategoryFilter,
} from "@/lib/product-filters";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { cn } from "@/lib/utils";

/** İmleç öğeye girince açılma / ayrılınca kapanma gecikmeleri (ms). */
const OPEN_DELAY = 60;
const CLOSE_DELAY = 200;

const EASE = [0.22, 1, 0.36, 1] as const;

/** Ana navbar tipografisi: kalın, sıkı, sistem (SF Pro) yazı tipi. */
const NAV_TEXT = "font-sf text-[16px] font-bold uppercase xl:text-[18px]";

/** Hover / aktif / açık durumda altta beliren ince mavi çizgi. */
const UNDERLINE =
  "relative after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 after:content-['']";

/**
 * Masaüstü orta navigasyon. Ayakkabılar ve Giyim küçük birer açılır menü
 * açar: fare ile hover'da, dokunma/klavyede tıklamayla.
 *
 * Her açılır öğenin sarmalayıcısı header yüksekliği boyunca uzanır; imleç
 * öğeden menüye inerken hover alanından çıkmaz. Aynı anda tek menü açık.
 */
export function DesktopNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointerType = useRef("mouse");
  const navRef = useRef<HTMLElement>(null);

  const schedule = (next: string | null, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };
  const close = () => {
    clearTimeout(timer.current);
    setOpen(null);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  // Dışarı tıklanınca / Escape ile kapanır (dokunmatik ve klavye için).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <nav
      ref={navRef}
      className="hidden h-full items-center gap-7 lg:flex xl:gap-10"
    >
      {NAV_ITEMS.map((item) => {
        if (item.menu) {
          const isOpen = open === item.label;
          const menuId = `nav-menu-${item.label}`;
          return (
            <div
              key={item.label}
              className="relative flex h-full items-center"
              onPointerEnter={(e) =>
                e.pointerType === "mouse" && schedule(item.label, OPEN_DELAY)
              }
              onPointerLeave={(e) =>
                e.pointerType === "mouse" && schedule(null, CLOSE_DELAY)
              }
            >
              {/* Yazı kategori sayfasına gider; ok menüyü açar. */}
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    NAV_TEXT,
                    UNDERLINE,
                    "hover:after:scale-x-100",
                    (isOpen || pathname === item.href) && "after:scale-x-100",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={NAV_TEXT}>{item.label}</span>
              )}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-label={`${item.label} menüsü`}
                onPointerDown={(e) => (pointerType.current = e.pointerType)}
                onClick={(e) => {
                  // Farede hover zaten açtı; tıklama kapatmasın. Dokunma ve
                  // klavyede (detail 0) aç/kapat gibi davranır.
                  const mouse = e.detail > 0 && pointerType.current === "mouse";
                  if (mouse) setOpen(item.label);
                  else setOpen(isOpen ? null : item.label);
                }}
                className="relative ml-1 grid size-6 place-items-center after:absolute after:-inset-1.5 after:content-['']"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                  strokeWidth={2.4}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={menuId}
                    key={menuId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.22, ease: EASE },
                    }}
                    exit={{ opacity: 0, y: 4, transition: { duration: 0.14 } }}
                    className={cn(
                      "absolute top-[calc(100%-10px)] flex rounded-md border border-black/[0.07] bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]",
                      // Vitrinli menü geniş: sağdaki öğede ekrandan taşmasın
                      // diye öğenin ortasına hizalanır.
                      item.showcase ? "left-1/2 -translate-x-1/2" : "-left-4",
                    )}
                  >
                    <ul className="min-w-60 py-2">
                      {item.menu.map((link, i) => (
                        <li key={link.label}>
                          <DropdownLink
                            link={link}
                            primary={i === 0 || !!link.children}
                            onNavigate={close}
                          />
                          {link.children && (
                            <ul className="pb-1">
                              {link.children.map((child) => (
                                <li key={child.label}>
                                  <DropdownLink
                                    link={child}
                                    primary={false}
                                    nested
                                    onNavigate={close}
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                    {item.showcase && (
                      <MenuShowcase
                        category={item.showcase}
                        onNavigate={close}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }

        if (!item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title="Yakında"
              className={cn(NAV_TEXT, "cursor-default")}
            >
              {item.label}
            </span>
          );
        }

        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              NAV_TEXT,
              UNDERLINE,
              "hover:after:scale-x-100",
              active && "after:scale-x-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const SHOWCASE_COUNT = 3;

/**
 * Açılır menünün sağındaki "Yeni gelenler": kategorinin stokta olan en yeni
 * ürünleri. Admin'den eklenen ürünlerin id'si sırayla büyüdüğü için en yeni
 * ürün en büyük id'lidir.
 */
function MenuShowcase({
  category,
  onNavigate,
}: {
  category: CategoryFilter;
  onNavigate: () => void;
}) {
  const { products } = useCatalog();
  const items = products
    .filter(
      (p) =>
        matchesCategory(p.category, category) &&
        p.variants.some((v) => v.stock > 0),
    )
    .sort((a, b) => idNumber(b.id) - idNumber(a.id))
    .slice(0, SHOWCASE_COUNT);
  if (items.length === 0) return null;

  return (
    <div className="w-72 border-l border-black/[0.07] p-4">
      <p className="px-1 font-sf text-[11px] font-bold uppercase tracking-[0.1em] text-black/40">
        Yeni Gelenler
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((p) => {
          const { brand, model } = productNameParts(p);
          const summary = variantSummary(p);
          return (
            <li key={p.id}>
              <Link
                href={`/urun/${p.slug}`}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-md p-1 transition-colors hover:bg-black/[0.04]"
              >
                <span className="relative aspect-4/5 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                  <Image
                    src={p.images[0].src}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 font-sf">
                  {brand && (
                    <span
                      lang="en"
                      className="block truncate text-[11px] font-extrabold uppercase"
                    >
                      {brand}
                    </span>
                  )}
                  <span className="line-clamp-2 text-[13px] font-medium leading-snug text-black/80">
                    {model}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-black/45">
                    <span className="font-bold text-black">
                      {formatPrice(p.price, p.currency)}
                    </span>
                    {summary && <> · {summary}</>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function idNumber(id: string): number {
  return Number(id.replace(/\D/g, "")) || 0;
}

/** Açılır menü satırı: bağlantı ya da henüz yayında olmayan pasif öğe. */
function DropdownLink({
  link,
  primary,
  nested = false,
  onNavigate,
}: {
  link: MenuLink;
  primary: boolean;
  /** Marka altındaki model satırı: girintili ve daha küçük. */
  nested?: boolean;
  onNavigate: () => void;
}) {
  const base = cn(
    "font-sf flex items-baseline gap-2 px-4 text-[15px]",
    nested ? "py-1.5 pl-7 text-[14px]" : "py-2",
  );

  if (!link.href) {
    return (
      <span
        aria-disabled="true"
        lang={link.lang}
        className={cn(base, "cursor-default font-medium text-black/30")}
      >
        {link.label}
        <Soon />
      </span>
    );
  }

  return (
    <Link
      href={link.href}
      lang={link.lang}
      onClick={onNavigate}
      className={cn(
        base,
        "transition-colors hover:bg-black/[0.04] hover:text-black",
        primary ? "font-bold text-black" : "font-semibold text-black/70",
      )}
    >
      {link.label}
    </Link>
  );
}

function Soon() {
  return (
    <span
      lang="tr"
      className="text-[9px] font-semibold uppercase tracking-[0.12em] text-black/35"
    >
      Yakında
    </span>
  );
}

/**
 * Mobil/tablet menüsü: hamburger düğmesi ve header'ın altından açılan tam
 * genişlikte panel. Ayakkabılar ve Giyim akordeon olarak açılır.
 */
export function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);
  const row =
    "flex w-full items-center justify-between py-4 font-sf text-[18px] font-bold uppercase";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        className="relative -ml-1 grid size-9 place-items-center"
      >
        {open ? (
          <X className="size-6" strokeWidth={1.8} />
        ) : (
          <Menu className="size-6" strokeWidth={1.8} />
        )}
      </button>

      {/* Konumlu ilk ata header'dır: panel header'ın hemen altından açılır. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.24, ease: EASE },
            }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-black/[0.08] bg-white"
          >
            <ul className="px-5 pb-10 sm:px-8">
              {NAV_ITEMS.map((item) => {
                if (item.menu) {
                  const expanded = section === item.label;
                  const panelId = `mobile-menu-${item.label}`;
                  return (
                    <li
                      key={item.label}
                      className="border-b border-black/[0.08]"
                    >
                      {/* Yazı kategori sayfasına gider; ok akordeonu açar. */}
                      <div className="flex items-center">
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={
                              pathname === item.href ? "page" : undefined
                            }
                            className={cn(
                              row,
                              "flex-1",
                              pathname === item.href && "text-brand",
                            )}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span className={cn(row, "flex-1")}>
                            {item.label}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setSection(expanded ? null : item.label)
                          }
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          aria-label={`${item.label} alt kategorileri`}
                          className="-mr-2 grid size-11 shrink-0 place-items-center"
                        >
                          <ChevronDown
                            className={cn(
                              "size-5 transition-transform duration-300",
                              expanded && "rotate-180",
                            )}
                            strokeWidth={2.2}
                          />
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            id={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <ul className="-mx-4 pb-3">
                              {item.menu.map((link, i) => (
                                <li key={link.label}>
                                  <DropdownLink
                                    link={link}
                                    primary={i === 0 || !!link.children}
                                    onNavigate={close}
                                  />
                                  {link.children && (
                                    <ul className="pb-1">
                                      {link.children.map((child) => (
                                        <li key={child.label}>
                                          <DropdownLink
                                            link={child}
                                            primary={false}
                                            nested
                                            onNavigate={close}
                                          />
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                }

                return (
                  <li key={item.label} className="border-b border-black/[0.08]">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={
                          pathname === item.href ? "page" : undefined
                        }
                        className={cn(
                          row,
                          pathname === item.href && "text-brand",
                        )}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className={cn(row, "cursor-default")}
                      >
                        <span className="flex items-baseline gap-2">
                          {item.label}
                          <Soon />
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
