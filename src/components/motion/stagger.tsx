"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  /** Çocuklar arası gecikme (sn) */
  stagger?: number;
  delay?: number;
};

/**
 * İçindeki <StaggerItem> öğelerini sırayla gösteren kapsayıcı.
 * Tetikleyici burasıdır; öğeler kendi görünürlüklerini yönetmez.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: StaggerProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  as?: "div" | "li" | "article";
};

/** Sadece <Stagger> içinde kullanılır; sırasını ebeveynden alır. */
export function StaggerItem({
  children,
  className,
  variants = fadeInUp,
  as = "div",
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const Component = motion[as];
  return (
    <Component className={className} variants={variants}>
      {children}
    </Component>
  );
}
