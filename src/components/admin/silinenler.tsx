"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import {
  urunGeriGetir,
  urunKaliciSil,
  type Sonuc,
} from "@/app/admin/actions";

const BOS: Sonuc = { durum: "bos" };

export type SilinenUrun = {
  id: string;
  name: string;
  kategori: string;
  gorsel?: string;
};

/**
 * Çöp kutusu. Silinen ürün mağazada görünmez ama verisi ve görselleri durur:
 * buradan geri getirilir ya da kalıcı silinir. Kalıcı silme iki adımlıdır.
 */
export function Silinenler({ urunler }: { urunler: SilinenUrun[] }) {
  return (
    <section aria-labelledby="silinenler-baslik" className="mt-16">
      <h2 id="silinenler-baslik" className="micro text-foreground/45">
        Silinenler · {urunler.length}
      </h2>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Bu ürünler mağazada görünmez. Geri getirebilir ya da kalıcı olarak
        silebilirsin.
      </p>
      <ul className="mt-5 grid gap-2">
        {urunler.map((u) => (
          <SilinenSatir key={u.id} urun={u} />
        ))}
      </ul>
    </section>
  );
}

function SilinenSatir({ urun }: { urun: SilinenUrun }) {
  const router = useRouter();
  const [onay, setOnay] = useState(false);
  const [geriSonuc, geriGetir, geriGetiriliyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      const r = await urunGeriGetir(onceki, fd);
      if (r.durum === "ok") router.refresh();
      return r;
    },
    BOS,
  );
  const [silSonuc, sil, siliniyor] = useActionState(
    async (onceki: Sonuc, fd: FormData) => {
      const r = await urunKaliciSil(onceki, fd);
      if (r.durum === "ok") router.refresh();
      return r;
    },
    BOS,
  );
  const hata = [geriSonuc, silSonuc].find(
    (s): s is Extract<Sonuc, { durum: "hata" }> => s.durum === "hata",
  );

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[var(--radius-product)] bg-background px-3 py-3 ring-1 ring-border/70">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted opacity-60">
        {urun.gorsel && (
          <Image
            src={urun.gorsel}
            alt={urun.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground/70">
          {urun.name}
        </p>
        <p className="mt-0.5 text-[12px] text-foreground/40">
          {urun.kategori} · {urun.id}
        </p>
        {hata && (
          <p role="alert" className="mt-1 text-[12px] text-brand">
            {hata.mesaj}
          </p>
        )}
      </div>
      <form className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="urunId" value={urun.id} />
        {onay ? (
          <>
            <span className="text-[13px] text-foreground/70">
              Kalıcı silinsin mi?
            </span>
            <button
              type="submit"
              formAction={sil}
              disabled={siliniyor}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-3.5 micro text-background ring-1 ring-brand transition-colors hover:bg-foreground/90 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" strokeWidth={1.8} />
              {siliniyor ? "Siliniyor…" : "Evet, kalıcı sil"}
            </button>
            <button
              type="button"
              onClick={() => setOnay(false)}
              className="micro text-foreground/50 transition-colors hover:text-foreground"
            >
              Vazgeç
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              formAction={geriGetir}
              disabled={geriGetiriliyor}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-3.5 micro text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.8} />
              {geriGetiriliyor ? "Getiriliyor…" : "Geri getir"}
            </button>
            <button
              type="button"
              onClick={() => setOnay(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full px-3 micro text-foreground/50 transition-colors hover:text-brand"
            >
              <Trash2 className="size-3.5" strokeWidth={1.8} />
              Kalıcı sil
            </button>
          </>
        )}
      </form>
    </li>
  );
}
