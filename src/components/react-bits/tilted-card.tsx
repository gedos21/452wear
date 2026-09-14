"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * React Bits — TiltedCard (https://reactbits.dev/components/tilted-card)
 * Projeye uyarlandı: demo tooltip'i, "mobile warning" metni ve <img> tabanlı
 * içerik kaldırıldı; kart artık istediğimiz herhangi bir içeriği sarmalıyor.
 * 3B'de öne çıkması istenen çocuk elemanlar [transform:translateZ(Npx)] alır.
 */

const SPRING: SpringOptions = { damping: 30, stiffness: 120, mass: 1.4 };

type TiltedCardProps = {
  children: React.ReactNode;
  className?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  /** false ise (dokunmatik cihaz / reduced motion) tilt tamamen devre dışı */
  enabled?: boolean;
};

export function TiltedCard({
  children,
  className,
  rotateAmplitude = 9,
  scaleOnHover = 1.03,
  enabled = true,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const scale = useSpring(1, SPRING);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rx = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const ry = (offsetX / (rect.width / 2)) * rotateAmplitude;
    rotateX.set(rx);
    rotateY.set(ry);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      className={cn("[perspective:900px]", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="h-full w-full will-change-transform [transform-style:preserve-3d]"
        style={{ rotateX, rotateY, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}
