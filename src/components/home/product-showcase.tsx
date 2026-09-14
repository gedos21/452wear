"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "motion/react";
import { Plus } from "lucide-react";
import { TiltedCard } from "@/components/react-bits";
import {
  PRODUCT_ASPECT,
  PRODUCT_SURFACE,
} from "@/components/product/product-surface";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

const PARALLAX: SpringOptions = { damping: 26, stiffness: 90, mass: 1.2 };

/**
 * Hero'nun sağ tarafı: imleçle hafifçe eğilen tek bir ürün kartı. Aynı imleç
 * kaynağı hem kartın eğimini hem de içindeki fotoğrafın kaymasını besliyor;
 * genlikler kartın kenar boşluğundan küçük tutuldu ki sayfa yatay kaymasın.
 */
export function ProductShowcase({ products }: { products: Product[] }) {
  const [main] = products;

  const reduced = useReducedMotion();
  const finePointer = useFinePointer();
  const interactive = finePointer && !reduced;

  // İmleç konumu, kapsayıcı içinde -1..1 aralığına normalize edilir.
  const pointerX = useSpring(useMotionValue(0), PARALLAX);
  const pointerY = useSpring(useMotionValue(0), PARALLAX);

  // Fotoğraf, kartın kendisinden daha az yol alır → derinlik hissi.
  const photoX = useTransform(pointerX, (v) => v * 7);
  const photoY = useTransform(pointerY, (v) => v * 5);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <div
      className="relative w-full"
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
    >
      <TiltedCard
        enabled={interactive}
        rotateAmplitude={9}
        scaleOnHover={1.03}
        className={`relative z-10 mx-auto ${PRODUCT_ASPECT} w-[88%] lg:w-[86%]`}
      >
        <MainCard product={main} photoX={photoX} photoY={photoY} />
      </TiltedCard>
    </div>
  );
}

function MainCard({
  product,
  photoX,
  photoY,
}: {
  product: Product;
  photoX: MotionValue<number>;
  photoY: MotionValue<number>;
}) {
  const image = product.images[0];

  return (
    <div className="relative h-full w-full [transform-style:preserve-3d]">
      <Link
        href={`/urun/${product.slug}`}
        className={cn(
          PRODUCT_SURFACE,
          "absolute inset-0",
          // Katmanlı, doğal gölge: temas + orta + uzak. Hepsi düşük opaklıkta,
          // hale gibi görünmemesi için negatif yayılımla.
          "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_18px_-10px_rgb(0_0_0/0.16),0_24px_48px_-28px_rgb(0_0_0/0.20)]",
        )}
      >
        {/* scale, kayma sırasında kenarların açılmaması için */}
        <motion.div
          className="absolute inset-0"
          style={{ x: photoX, y: photoY, scale: 1.05 }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 450px, 84vw"
            className="object-cover"
          />
        </motion.div>

        {/* Bevel: üstte ışık alan ince çizgi, altta hafif gölge, çepeçevre saç teli kenar */}
        <div className="pointer-events-none absolute inset-0 rounded-product shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-1px_0_rgb(0_0_0/0.07),inset_0_0_0_1px_rgb(0_0_0/0.07)]" />
      </Link>

      {/* Bilgi şeridi: 3B'de fotoğrafın üzerinde hafifçe yükselir. */}
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-[12px] bg-background/95 px-3.5 py-3 shadow-[0_2px_10px_-5px_rgb(0_0_0/0.22)] ring-1 ring-foreground/5 [transform:translateZ(38px)]">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium leading-snug">
            {product.name}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {formatPrice(product.price, product.currency)}
          </div>
        </div>
        <AddToCartButton />
      </div>
    </div>
  );
}

/** Hover/focus'ta "+" işareti açılıp "SEPETE EKLE" yazısını gösterir. */
function AddToCartButton() {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      aria-label="Sepete ekle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="inline-flex h-8 shrink-0 items-center rounded-full bg-foreground px-2 text-background"
    >
      <Plus className="size-4 shrink-0" strokeWidth={2} />
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="label"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 34,
              opacity: { duration: 0.15 },
            }}
            className="overflow-hidden"
          >
            <span className="micro block whitespace-nowrap pl-2 pr-1">
              Sepete Ekle
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
