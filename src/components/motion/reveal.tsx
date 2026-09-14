"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { fadeInUp } from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Animasyon gecikmesi (sn) */
  delay?: number;
  variants?: Variants;
  /** "mount": sayfa açılışında, "view": görünür alana girince */
  trigger?: "mount" | "view";
  as?: "div" | "section" | "li" | "article" | "h1" | "p";
};

/**
 * İçeriği hafifçe belirtir. Kullanıcı "reduced motion" seçtiyse
 * animasyon uygulanmaz.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variants = fadeInUp,
  trigger = "view",
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();

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
