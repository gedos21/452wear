"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, RotateCcw, Shuffle } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { formatPrice } from "@/lib/format";
import {
  BUTCE_SECENEKLERI,
  RENK_SECENEKLERI,
  TARZ_SECENEKLERI,
  TUR_SECENEKLERI,
  kombinKur,
  type Butce,
  type Cevaplar,
  type Kombin,
  type KombinTuru,
  type Tarz,
} from "@/lib/kombin";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

const ADIM_SAYISI = 4;

/**
 * Kombin öner akışı: dört soru, sonra katalogdan kurulmuş bir kombin.
 *
 * Ürünler UYDURULMAZ; öneri her zaman mevcut katalogdaki stokta olan
 * ürünlerden gelir (bkz. lib/kombin). Uygun kombin çıkmazsa ekran bunu
 * açıkça söyler ve seçimleri değiştirmeyi önerir.
 */
export function KombinAkisi({ products }: { products: Product[] }) {
  const [adim, setAdim] = useState(0); // 0..3 sorular, 4 sonuç
  const [tarz, setTarz] = useState<Tarz | null>(null);
  const [tur, setTur] = useState<KombinTuru | null>(null);
  const [renkler, setRenkler] = useState<string[]>([]);
  const [butce, setButce] = useState<Butce | undefined>(undefined);
  const [varyasyon, setVaryasyon] = useState(0);
  const [kombin, setKombin] = useState<Kombin | null>(null);
  const [sonucVar, setSonucVar] = useState(false);

  const cevaplar = (): Cevaplar => ({
    tarz: tarz!,
    tur: tur!,
    renkler,
    butce: butce ?? null,
  });

  function kur(yeniVaryasyon: number) {
    const sonuc = kombinKur(products, cevaplar(), yeniVaryasyon);
    setKombin(sonuc);
    setSonucVar(true);
    setVaryasyon(yeniVaryasyon);
    setAdim(ADIM_SAYISI);
  }

  function devam() {
    if (adim === ADIM_SAYISI - 1) kur(0);
    else setAdim((a) => a + 1);
  }

  function bastanBasla() {
    setAdim(0);
    setTarz(null);
    setTur(null);
    setRenkler([]);
    setButce(undefined);
    setKombin(null);
    setSonucVar(false);
    setVaryasyon(0);
  }

  const devamAktif =
    (adim === 0 && tarz !== null) ||
    (adim === 1 && tur !== null) ||
    adim === 2 || // renk seçimi boş bırakılabilir ("fark etmez")
    (adim === 3 && butce !== undefined);

  /* ---------------- Sonuç ---------------- */
  if (sonucVar) {
    if (!kombin) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-[clamp(1.75rem,6vw,3rem)] font-extrabold tracking-[-0.03em]">
            KOMBİN KURULAMADI<span className="text-brand">.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-muted-foreground">
            Seçtiğin bütçe ve renklerle stoktaki ürünlerden bir kombin
            çıkmadı. Bütçeyi yükseltip ya da rengi &quot;fark etmez&quot;
            bırakıp tekrar dene.
          </p>
          <button
            type="button"
            onClick={bastanBasla}
            className="mt-9 inline-flex h-13 items-center gap-2.5 rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90"
          >
            <RotateCcw className="size-4" strokeWidth={1.8} />
            Baştan dene
          </button>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-display text-[clamp(2rem,7vw,3.75rem)] font-extrabold leading-[1] tracking-[-0.035em]">
          KOMBİNİN HAZIR<span className="text-brand">.</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Seçimlerine göre mağazadaki stoktaki ürünlerden kuruldu.
        </p>

        <div
          className={cn(
            "mt-10 grid gap-x-4 gap-y-10 sm:gap-x-6",
            kombin.parcalar.length === 2
              ? "grid-cols-2 lg:grid-cols-2"
              : "grid-cols-2 lg:grid-cols-3",
          )}
        >
          {kombin.parcalar.map((urun) => (
            <div key={urun.id}>
              <ProductCard
                product={urun}
                sizes="(min-width: 1024px) 30vw, 45vw"
              />
              <Link
                href={`/urun/${urun.slug}`}
                className="mt-3 inline-block micro text-foreground/50 transition-colors hover:text-foreground"
              >
                Ürün sayfası →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/70 pt-6">
          <div className="flex items-baseline justify-between gap-4">
            <span className="micro text-foreground/45">Toplam</span>
            <span className="font-sf text-2xl font-bold">
              {formatPrice(kombin.toplam, kombin.parcalar[0].currency)}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {/* Her parçanın kendi "Ürün sayfası" bağlantısı var; buradaki
                birincil eylem yeni bir kombin denemek. */}
            <button
              type="button"
              onClick={() => kur(varyasyon + 1)}
              className="inline-flex h-13 items-center gap-2.5 rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90"
            >
              <Shuffle className="size-3.5" strokeWidth={1.8} />
              Başka kombin öner
            </button>
            <button
              type="button"
              onClick={bastanBasla}
              className="inline-flex h-13 items-center gap-2 rounded-full px-5 micro text-foreground/50 transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.8} />
              Baştan dene
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------- Sorular ---------------- */
  return (
    <div className="mx-auto max-w-2xl">
      {/* İlerleme */}
      <div className="flex items-center gap-4">
        <span className="micro text-foreground/45">
          {adim + 1} / {ADIM_SAYISI}
        </span>
        <div
          aria-hidden
          className="h-px flex-1 overflow-hidden bg-border"
        >
          <motion.div
            className="h-full bg-brand"
            initial={false}
            animate={{ width: `${((adim + 1) / ADIM_SAYISI) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <motion.div
        key={adim}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-8"
      >
        {adim === 0 && (
          <Soru baslik="Nasıl bir tarz arıyorsun?">
            {TARZ_SECENEKLERI.map((s) => (
              <Secenek
                key={s.deger}
                aktif={tarz === s.deger}
                onClick={() => setTarz(s.deger)}
              >
                {s.etiket}
              </Secenek>
            ))}
          </Soru>
        )}

        {adim === 1 && (
          <Soru baslik="Nasıl bir kombin istiyorsun?">
            {TUR_SECENEKLERI.map((s) => (
              <Secenek
                key={s.deger}
                aktif={tur === s.deger}
                onClick={() => setTur(s.deger)}
                alt={s.aciklama}
              >
                {s.etiket}
              </Secenek>
            ))}
          </Soru>
        )}

        {adim === 2 && (
          <Soru
            baslik="Hangi renkleri tercih ediyorsun?"
            not="Birden fazla seçebilirsin."
          >
            {RENK_SECENEKLERI.map((renk) => (
              <Secenek
                key={renk}
                aktif={renkler.includes(renk)}
                onClick={() =>
                  setRenkler((r) =>
                    r.includes(renk) ? r.filter((x) => x !== renk) : [...r, renk],
                  )
                }
              >
                {renk}
              </Secenek>
            ))}
            <Secenek aktif={renkler.length === 0} onClick={() => setRenkler([])}>
              Fark etmez
            </Secenek>
          </Soru>
        )}

        {adim === 3 && (
          <Soru baslik="Ne kadar harcamak istiyorsun?">
            {BUTCE_SECENEKLERI.map((s) => (
              <Secenek
                key={s.etiket}
                aktif={butce === s.deger && butce !== undefined}
                onClick={() => setButce(s.deger)}
              >
                {s.etiket}
              </Secenek>
            ))}
          </Soru>
        )}
      </motion.div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={devam}
          disabled={!devamAktif}
          className={cn(
            "inline-flex h-13 items-center gap-2.5 rounded-full px-8 micro transition-colors",
            devamAktif
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "cursor-not-allowed bg-muted text-foreground/35",
          )}
        >
          {adim === ADIM_SAYISI - 1 ? "Kombini oluştur" : "Devam et"}
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </button>
        {adim > 0 && (
          <button
            type="button"
            onClick={() => setAdim((a) => a - 1)}
            className="micro text-foreground/50 transition-colors hover:text-foreground"
          >
            ← Geri
          </button>
        )}
      </div>
    </div>
  );
}

function Soru({
  baslik,
  not,
  children,
}: {
  baslik: string;
  not?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-[clamp(1.75rem,6vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        {baslik}
      </h1>
      {not && <p className="mt-3 text-[13px] text-muted-foreground">{not}</p>}
      <div className="mt-7 flex flex-wrap gap-2.5">{children}</div>
    </div>
  );
}

function Secenek({
  aktif,
  onClick,
  alt,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  alt?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={cn(
        "rounded-2xl px-5 py-3.5 text-left text-[15px] transition-colors",
        aktif
          ? "bg-foreground text-background"
          : "bg-muted text-foreground/75 hover:text-foreground",
      )}
    >
      <span className="block font-medium">{children}</span>
      {alt && (
        <span
          className={cn(
            "mt-0.5 block text-[12px]",
            aktif ? "text-background/60" : "text-foreground/45",
          )}
        >
          {alt}
        </span>
      )}
    </button>
  );
}
