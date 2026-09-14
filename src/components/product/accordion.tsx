"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

/** Detay panelindeki açılır bilgi bölümleri. */
export function Accordion({
  items,
}: {
  items: { title: string; content: React.ReactNode }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="border-t border-border/70">
      {items.map((item) => {
        const isOpen = open === item.title;
        return (
          <div key={item.title} className="border-b border-border/70">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.title)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left micro transition-colors hover:text-foreground"
            >
              {item.title}
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="shrink-0 text-foreground/50"
              >
                <Plus className="size-4" strokeWidth={1.6} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 34,
                    opacity: { duration: 0.15 },
                  }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 text-[13px] leading-relaxed text-muted-foreground">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
