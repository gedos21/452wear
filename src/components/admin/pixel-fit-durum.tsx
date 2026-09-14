import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export type PixelFitDurum = "hazir" | "bekliyor" | "yok";

export function pixelFitDurumu(product: Pick<Product, "tryOn">): PixelFitDurum {
  if (!product.tryOn) return "yok";
  return product.tryOn.status === "approved" ? "hazir" : "bekliyor";
}

const ETIKET: Record<PixelFitDurum, { isaret: string; metin: string }> = {
  hazir: { isaret: "✓", metin: "Hazır" },
  bekliyor: { isaret: "◐", metin: "Onay bekliyor" },
  yok: { isaret: "○", metin: "Hazırlanmadı" },
};

/** Liste ve form için tek durum rozeti. */
export function PixelFitRozet({
  durum,
  className,
}: {
  durum: PixelFitDurum;
  className?: string;
}) {
  const { isaret, metin } = ETIKET[durum];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]",
        durum === "hazir" && "text-foreground",
        durum === "bekliyor" && "text-brand",
        durum === "yok" && "text-foreground/45",
        className,
      )}
    >
      <span aria-hidden className="w-3 text-center">
        {isaret}
      </span>
      {metin}
    </span>
  );
}
