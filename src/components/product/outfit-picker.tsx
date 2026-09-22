"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { PRODUCT_ASPECT, PRODUCT_SURFACE } from "./product-surface";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { productNameParts } from "@/lib/product-filters";
import { defaultColor, sizeAvailability } from "@/lib/product-variants";
import { cn } from "@/lib/utils";
import type { Product, ProductSize } from "@/types/product";

/**
 * "Bunu tamamla" kombininin etkileşimli kısmı: parçalar, her parça için beden
 * seçimi, toplam ve sepete ekleme.
 *
 * Beden/numara listesi ürünün KENDİ varyantlarından gelir (lib/product-variants);
 * ayrı bir stok kaynağı yoktur. Yalnızca stokta olan bedenler seçilebilir ve
 * sepete giden adet varyantın stoğunu aşamaz. Tek beden stoktaysa o seçili
 * gelir — ürün sayfasındaki davranışla aynı.
 */
export function OutfitPicker({
  pieces,
  currentId,
  total,
}: {
  pieces: Product[];
  currentId: string;
  total: number;
}) {
  const { add } = useCart();

  // Renk: üründe stokta olan ilk renk (ürün sayfasındaki varsayılanla aynı).
  // Beden listesi bu renge göre çıkar.
  const renkler = new Map(pieces.map((p) => [p.id, defaultColor(p)]));
  const bedenler = new Map(
    pieces.map((p) => [
      p.id,
      sizeAvailability(p, renkler.get(p.id) ?? "").filter((s) => s.inStock),
    ]),
  );

  const [secim, setSecim] = useState<Record<string, ProductSize | "">>(() =>
    Object.fromEntries(
      pieces.map((p) => {
        const stoktakiler = sizeAvailability(p, defaultColor(p)).filter(
          (s) => s.inStock,
        );
        // Tek seçenek varsa seçmek zorunda bırakmanın anlamı yok.
        return [p.id, stoktakiler.length === 1 ? stoktakiler[0].size : ""];
      }),
    ),
  );
  const [uyari, setUyari] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<{ eklenen: number; dolu: string[] } | null>(
    null,
  );
  const kilit = useRef(false);

  useEffect(() => {
    if (!sonuc) return;
    const t = setTimeout(() => {
      kilit.current = false;
      setSonuc(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [sonuc]);

  function ekle() {
    if (kilit.current) return;

    const eksik = pieces.filter((p) => !secim[p.id]);
    if (eksik.length > 0) {
      setUyari(
        eksik.length === pieces.length
          ? "Parçalar için beden seç."
          : `${eksik.map((p) => productNameParts(p).model).join(", ")} için beden seç.`,
      );
      return;
    }
    setUyari(null);
    kilit.current = true;

    let eklenen = 0;
    const dolu: string[] = [];
    for (const piece of pieces) {
      const size = secim[piece.id] as ProductSize;
      const color = renkler.get(piece.id) ?? "";
      const stok =
        piece.variants.find((v) => v.size === size && v.color === color)
          ?.stock ?? 0;
      const adet = add({
        productId: piece.id,
        size,
        color,
        price: piece.price,
        currency: piece.currency,
        max: stok,
      });
      if (adet > 0) eklenen += 1;
      else dolu.push(productNameParts(piece).model);
    }
    setSonuc({ eklenen, dolu });
  }

  const basarili = sonuc !== null && sonuc.eklenen > 0;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start lg:gap-12">
      <ul className="grid grid-cols-3 gap-3 sm:gap-4">
        {pieces.map((piece) => {
          const { brand, model } = productNameParts(piece);
          const bu = piece.id === currentId;
          const secenekler = bedenler.get(piece.id) ?? [];
          const ayakkabi = piece.category === "ayakkabi";
          return (
            <li key={piece.id}>
              <Link href={`/urun/${piece.slug}`} className="group block">
                <div className={`relative ${PRODUCT_SURFACE} ${PRODUCT_ASPECT}`}>
                  <Image
                    src={piece.images[0].src}
                    alt={piece.images[0].alt}
                    fill
                    sizes="(min-width: 1024px) 18vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3 font-sf">
                  {brand && (
                    <p
                      lang="en"
                      className="text-[11px] font-extrabold uppercase leading-tight"
                    >
                      {brand}
                    </p>
                  )}
                  <p className="mt-0.5 truncate text-[13px] font-medium leading-snug text-foreground/85">
                    {model}
                  </p>
                  <p className="mt-1 text-[13px] font-bold">
                    {formatPrice(piece.price, piece.currency)}
                  </p>
                  {bu && (
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-foreground">
                      Bu ürün
                    </p>
                  )}
                </div>
              </Link>

              {/* Beden seçimi: dar sütuna sığsın diye yerel menü. Listede
                  yalnızca stoktaki bedenler var. */}
              {secenekler.length > 0 && (
                <label className="mt-2 block">
                  <span className="sr-only">
                    {model} için {ayakkabi ? "numara" : "beden"}
                  </span>
                  <select
                    value={secim[piece.id] ?? ""}
                    onChange={(e) => {
                      setUyari(null);
                      setSecim((s) => ({
                        ...s,
                        [piece.id]: e.target.value as ProductSize | "",
                      }));
                    }}
                    className={cn(
                      // Dar sütunda yerli ok işaretiyle çakışmasın diye yatay
                      // boşluk küçük tutulur (320px'te sütun ~88px).
                      "h-9 w-full rounded-full border bg-transparent pl-2.5 pr-1 font-sf text-[12px] font-semibold outline-none transition-colors focus-visible:border-foreground",
                      secim[piece.id]
                        ? "border-foreground/25 text-foreground"
                        : "border-foreground/15 text-foreground/50",
                    )}
                  >
                    <option value="">{ayakkabi ? "Numara" : "Beden"}</option>
                    {secenekler.map((s) => (
                      <option key={s.size} value={s.size}>
                        {s.size}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </li>
          );
        })}
      </ul>

      <div className="font-sf">
        <p className="micro text-foreground/45">Kombin toplamı</p>
        <p className="mt-1.5 text-2xl font-bold">
          {formatPrice(total, pieces[0].currency)}
        </p>

        {/* Buton blok bir kapsayıcıda: yanındaki bağlantı aynı satıra
            kaçmasın. */}
        <div className="mt-5">
          <button
            type="button"
            onClick={ekle}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-background transition-colors hover:bg-brand"
          >
            {basarili ? (
              <>
                <Check className="size-4" strokeWidth={2.2} />
                Sepete eklendi
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" strokeWidth={2} />
                Kombini sepete ekle
              </>
            )}
          </button>
        </div>

        {uyari && (
          <p className="mt-3 text-[13px] font-semibold text-brand" role="alert">
            {uyari}
          </p>
        )}

        {sonuc && (
          <p className="mt-3 text-[13px] text-foreground/60" role="status">
            {sonuc.eklenen === 0
              ? "Kombindeki parçalar zaten sepetinde; stokta daha fazlası yok."
              : sonuc.dolu.length > 0
                ? `${sonuc.eklenen} parça eklendi. ${sonuc.dolu.join(", ")} için stok sınırına ulaşıldı.`
                : "Parçalar seçtiğin bedenlerle sepetine eklendi."}
          </p>
        )}

        <Link
          href="/kombinini-bul"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground/55 transition-colors hover:text-foreground"
        >
          Kendi kombinini kur
          <ArrowRight className="size-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
