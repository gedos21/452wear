"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react";
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
  const ref = useRef<HTMLDivElement>(null);
  /*
   * Görünürlük `whileInView` yerine durumda tutulur: kapsayıcı bir kez
   * göründükten sonra "visible" durumunda KALIR, böylece sonradan eklenen
   * çocuklar (ör. "Daha Fazla Göster" ile gelen kartlar) da açılır.
   * whileInView + once ile kapsayıcı animasyonunu bitirmiş sayılıyor,
   * sonradan mount olan öğeler `hidden` (opacity: 0) takılı kalıyordu.
   *
   * Eşik oransal değil: uzun bir ızgarada (28 ürün ≈ 5000px) "%20 görünür"
   * koşulu ekrana sığmadığı için hiç sağlanmaz. Kapsayıcının herhangi bir
   * parçası göründüğünde açılır.
   */
  const gorundu = useInView(ref, { once: true, amount: "some" });

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      animate={gorundu ? "visible" : "hidden"}
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
