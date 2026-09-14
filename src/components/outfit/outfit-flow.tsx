"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { BubbleMenu } from "@/components/react-bits";
import { ArrowRight } from "lucide-react";
import { OutfitResult } from "./outfit-result";
import {
  buildOutfit,
  QUESTIONS,
  type Outfit,
  type OutfitAnswers,
} from "@/lib/outfit";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Soru akışı. Adımlar tek eleman üzerinde `key` ile yeniden mount edilerek
 * geçiş yapar — çıkış animasyonuna bağımlı bir kurulum kullanılmıyor.
 */
export function OutfitFlow({ products }: { products: Product[] }) {
  const [step, setStep] = useState(-1); // -1: giriş, 0..n-1: sorular
  const [answers, setAnswers] = useState<Partial<OutfitAnswers>>({});
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [noMatch, setNoMatch] = useState(false);

  function restart() {
    setOutfit(null);
    setNoMatch(false);
    setAnswers({});
    setStep(0);
  }

  function answer(value: string) {
    const question = QUESTIONS[step];
    const next = {
      ...answers,
      [question.key]: value,
    } as Partial<OutfitAnswers>;
    setAnswers(next);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }

    const result = buildOutfit(products, next as OutfitAnswers);
    if (result) setOutfit(result);
    else setNoMatch(true);
  }

  if (outfit)
    return (
      <OutfitResult outfit={outfit} products={products} onRestart={restart} />
    );

  if (noMatch) {
    return (
      <div className="max-w-3xl">
        <h2 className="font-display text-[clamp(1.75rem,6vw,3rem)] font-extrabold tracking-[-0.03em]">
          KOMBİN KURULAMADI<span className="text-brand">.</span>
        </h2>
        <p className="mt-5 max-w-sm text-muted-foreground">
          Seçtiğin tercihlerde stokta uygun bir eşleşme bulamadık.
        </p>
        <button
          type="button"
          onClick={restart}
          className="mt-9 inline-flex h-13 items-center gap-2.5 rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90"
        >
          Baştan Dene
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    );
  }

  if (step === -1) {
    return (
      <motion.div
        className="max-w-3xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-[clamp(2.25rem,8vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          KENDİNE BİR
          <br />
          KOMBİN BUL<span className="text-brand">.</span>
        </h1>
        <p className="mt-7 max-w-sm text-muted-foreground">
          Birkaç soruya cevap ver. Gerisini bize bırak.
        </p>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="mt-10 inline-flex h-13 items-center gap-2.5 rounded-full bg-foreground px-8 micro text-background transition-colors hover:bg-foreground/90"
        >
          Başla
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </button>
      </motion.div>
    );
  }

  const question = QUESTIONS[step];

  return (
    <div className="max-w-3xl">
      {/* İlerleme: çubuk değil, kısa çizgiler */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5" aria-hidden>
          {QUESTIONS.map((q, i) => (
            <span
              key={q.key}
              className={cn(
                "h-px w-8 transition-colors",
                i <= step ? "bg-foreground" : "bg-foreground/20",
              )}
            />
          ))}
        </div>
        <span className="micro text-foreground/40">
          {String(step + 1).padStart(2, "0")} /{" "}
          {String(QUESTIONS.length).padStart(2, "0")}
        </span>
      </div>

      {/* Soru + baloncuklar. Adım değişince ikisi de yeniden mount olur;
          çıkan set popLayout ile akıştan çıkarılır, yeni set beklemez. */}
      <div className="mt-12 min-h-[19rem] sm:min-h-[17rem]">
        {/* Başlıkta çıkış animasyonu YOK: AnimatePresence çıkan başlığı
            akıştan çıkarıp yenisinin üzerine bindiriyordu. Tek eleman,
            `key` ile yeniden mount → sadece giriş animasyonu oynar. */}
        {/* Kardeş anahtarları benzersiz olmalı: ikisine de aynı key
            verilince React eşleştirmeyi bozup elemanları çoğaltıyordu. */}
        <motion.h2
          key={`soru-${question.key}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          aria-live="polite"
          className="max-w-2xl font-display text-[clamp(1.75rem,6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em]"
        >
          {question.prompt}
        </motion.h2>

        <BubbleMenu
          key={`baloncuk-${question.key}`}
          options={question.options}
          onSelect={answer}
          className="mt-12"
        />
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-12 micro text-foreground/40 transition-colors hover:text-foreground"
        >
          ← Geri
        </button>
      )}
    </div>
  );
}
