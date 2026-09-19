"use client";

import { usePathname } from "next/navigation";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

/** Duyuru şeridinde dönen mesajlar — TEK KAYNAK. Sırayla akar. */
export const ANNOUNCEMENTS: string[] = [
  "KREDİ KARTINA 6 TAKSİT İMKANI",
  // Eşik elle yazılmaz; kargo kuralından okunur (3.000 TL).
  `${FREE_SHIPPING_THRESHOLD.toLocaleString("tr-TR")} TL ÜZERİ ÜCRETSİZ KARGO`,
  "AYNI GÜN KARGO İMKANI",
];

/**
 * Bir gruptaki mesaj listesinin tekrar sayısı. Grup, en geniş ekrandan da
 * geniş olmalı; yoksa döngü başa sararken sağda boşluk görünür.
 */
const REPEAT = 4;

/**
 * Navbar'ın üstündeki ince, sürekli akan duyuru şeridi.
 *
 * Döngü saf CSS'tir: iz, birebir aynı iki gruptan oluşur ve -%50 kayar.
 * O anda ikinci grup birincinin yerindedir; animasyon başa sardığında
 * görüntü değişmediği için akış kesintisiz görünür. JS durum güncellemesi yok.
 * Hareket azaltma açıksa animasyon durur (motion-reduce).
 */
export function AnnouncementBar() {
  // Admin'in kendi kabuğu var; şerit yalnızca mağaza tarafında görünür.
  if (usePathname().startsWith("/admin")) return null;

  const group = Array.from({ length: REPEAT }, () => ANNOUNCEMENTS).flat();

  return (
    <div className="shrink-0 overflow-hidden bg-brand text-white">
      {/* Ekran okuyucular mesajları bir kez, düz liste olarak duyar. */}
      <p className="sr-only">{ANNOUNCEMENTS.join(". ")}</p>

      <div
        aria-hidden
        className="flex w-max animate-[ticker_60s_linear_infinite] motion-reduce:animate-none"
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {group.map((message, i) => (
              <li
                key={i}
                className="flex items-center py-2 micro font-medium whitespace-nowrap"
              >
                {message}
                <span className="px-5 sm:px-7">•</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
