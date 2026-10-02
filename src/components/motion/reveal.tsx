"use client";

import { motion, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { fadeInUp } from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Animasyon gecikmesi (sn) */
  delay?: number;
  variants?: Variants;
  /** "mount": sayfa açılışında, "view": görünür alana girince */
  trigger?: "mount" | "view";
  as?: "div" | "section" | "li" | "article" | "h1" | "h2" | "p";
};

/**
 * İçeriği hafifçe belirtir. Kullanıcı "reduced motion" seçtiyse
 * animasyon uygulanmaz.
 *
 * Tercih usePrefersReducedMotion ile okunur, motion'ın useReducedMotion'ı ile
 * değil: o, ilk istemci render'ında matchMedia'yı okuduğu için sunucu
 * (animasyonlu, opacity: 0) ile istemci (statik) farklı HTML çiziyor ve
 * hydration uyuşmazlığı çıkıyordu. Bu kanca hydration'da sunucuyla aynı
 * değeri verir, ardından gerçek tercihe geçer.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variants = fadeInUp,
  trigger = "view",
  as = "div",
}: RevealProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const Component = motion[as];
  const trig =
    trigger === "mount"
      ? { animate: "visible" as const }
      : {
          whileInView: "visible" as const,
          viewport: { once: true, amount: 0.2 },
        };

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      transition={{ delay }}
      {...trig}
    >
      {children}
    </Component>
  );
}
