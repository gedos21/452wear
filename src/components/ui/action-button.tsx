"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
};

/**
 * Sitenin tek buton tipi: hap formunda, mikro tipografili.
 * Hover'da bütün buton bir piksel yükselir, ok ucu öne kayar.
 */
export function ActionButton({
  href,
  children,
  variant = "solid",
  className,
}: ActionButtonProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="rest"
      whileHover={reduced ? undefined : "hover"}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      variants={{ rest: { y: 0 }, hover: { y: -2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="inline-flex"
    >
      <Link
        href={href}
        className={cn(
          "inline-flex h-12 items-center gap-2.5 rounded-full px-7 micro transition-colors",
          variant === "solid"
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "border border-foreground/20 text-foreground hover:border-foreground/60",
          className,
        )}
      >
        {children}
        <motion.span
          variants={{ rest: { x: 0 }, hover: { x: 4 } }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className="inline-flex"
        >
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </motion.span>
      </Link>
    </motion.div>
  );
}
