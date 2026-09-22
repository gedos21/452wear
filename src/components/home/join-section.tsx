import { Container } from "@/components/layout/container";
import { HOME_WIDTH } from "./home-layout";
import { Reveal } from "@/components/motion";
import { NewsletterForm } from "./newsletter-form";
import { INSTAGRAM_URL, instagramHandle } from "@/lib/community";

/**
 * Ana sayfa "Bize Katıl" bölümü. Solda e-posta bülteni, sağda Instagram.
 * Instagram adresi lib/community'den okunur; tanımlı değilse sağ sütun
 * çizilmez ve bölüm tek sütun kalır. Mobilde sütunlar alt alta gelir.
 */
export function JoinSection() {
  return (
    <section className="mt-8 border-t border-border/70 pt-12 sm:mt-10 sm:pt-14 lg:pt-16">
      <Container className={HOME_WIDTH}>
        <div
          className={
            INSTAGRAM_URL
              ? "grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20"
              : "max-w-xl"
          }
        >
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold leading-none tracking-[-0.03em] sm:text-5xl">
              BİZE KATIL<span className="text-brand">.</span>
            </h2>
            <p className="mt-4 max-w-md font-sf text-[16px] leading-relaxed text-foreground/65">
              452WEAR dünyasının bir parçası ol.
              <br />
              Yeni ürünler, özel fırsatlar ve gelişmelerden haberdar ol.
            </p>
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </Reveal>

          {INSTAGRAM_URL && (
            <Reveal
              delay={0.08}
              className="lg:border-l lg:border-border/70 lg:pl-20"
            >
              <h3 className="font-sf text-[13px] font-bold uppercase tracking-[0.04em]">
                Bizi takip et
              </h3>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`452WEAR Instagram (${instagramHandle(INSTAGRAM_URL)}) — yeni sekmede açılır`}
                className="group mt-5 inline-flex items-center gap-4"
              >
                <span className="grid size-16 place-items-center rounded-full border border-foreground/15 transition-colors group-hover:border-brand group-hover:text-brand">
                  <InstagramIcon className="size-7" />
                </span>
                <span className="font-sf text-[17px] font-semibold transition-colors group-hover:text-brand">
                  {instagramHandle(INSTAGRAM_URL)}
                </span>
              </a>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Sade, çizgi stilinde Instagram simgesi (diğer ikonlarla aynı dil). */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
