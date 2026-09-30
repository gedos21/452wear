import Link from "next/link";
import { Container } from "@/components/layout/container";
import { KombinKarti } from "@/components/kombin/kombin-karti";
import { kombinPanolari } from "@/lib/kombin-panolari";
import { HOME_WIDTH } from "./home-layout";

/** Ana sayfada gösterilen kombin sayısı; tamamı /kombinler'de. */
const ANASAYFA_ADET = 3;

/**
 * Ana sayfa "Kombinler": elle seçilmiş kombin panoları (data/kombinler).
 * Masaüstünde üç sütun, mobilde yana kaydırılan tek sıra.
 */
export async function KombinPanolari() {
  const kombinler = (await kombinPanolari()).slice(0, ANASAYFA_ADET);
  if (kombinler.length === 0) return null;

  return (
    <section className="pb-12 sm:pb-14">
      <Container className={HOME_WIDTH}>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div>
            <h2 className="whitespace-nowrap font-sf text-[24px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[32px]">
              Kombinler
            </h2>
            <p className="mt-2 font-sf text-[14px] text-foreground/55">
              Hazır kombinler, tek tıkla sepete.
            </p>
          </div>
          <Link
            href="/kombinler"
            className="shrink-0 pb-0.5 font-sf text-[13px] font-bold uppercase tracking-[0.04em] transition-colors hover:text-brand"
          >
            Tümünü gör →
          </Link>
        </div>
      </Container>

      {/* Mobilde kartlar kenardan kenara kayar; masaüstünde ızgara. */}
      <Container
        className={`mt-6 ${HOME_WIDTH} max-lg:max-w-none max-lg:px-0 sm:mt-7`}
      >
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {kombinler.map((k) => (
            <li
              key={k.slug}
              className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-auto"
            >
              <KombinKarti kombin={k} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
