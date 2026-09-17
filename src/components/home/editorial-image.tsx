"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { PRODUCT_SURFACE } from "@/components/product/product-surface";
import { cn } from "@/lib/utils";

/**
 * Kategori vitrininin büyük görseli. Görsel alanda ilerledikçe çok hafif
 * küçülür (1.06 → 1): sabit bir afiş yerine derinliği olan bir kare hissi.
 * Kullanıcı hareketi azaltmayı seçtiyse görsel sabit kalır.
 */
export function EditorialImage({
  href,
  src,
  alt,
}: {
  href: string;
  src: string;
  alt: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);

  return (
    <Link
      ref={ref}
      href={href}
      className={cn("relative block aspect-2/3", PRODUCT_SURFACE)}
    >
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { scale }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </motion.div>
    </Link>
  );
}
