import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { categoryHref } from "@/components/layout/nav-links";
import { HOME_WIDTH } from "./home-layout";

type Tile = {
  title: string;
  text: string;
  href: string;
  image: { src: string; alt: string };
  /** object-position — görselin kadrajda kalacak kısmı. */
  focus: string;
};

const TILES: Tile[] = [
  {
    title: "Ayakkabılar",
    text: "Ayakkabı koleksiyonunu keşfet.",
    href: categoryHref("ayakkabi"),
    image: {
      src: "/editorial/ayakkabi.webp",
      alt: "452WEAR ayakkabı koleksiyonundan sneaker'lar",
    },
    // Afişin üstündeki baskılı başlık kadraj dışında kalsın.
    focus: "center bottom",
  },
  {
    title: "Giyim",
    text: "Giyim koleksiyonunu keşfet.",
    href: categoryHref("giyim"),
    image: {
      src: "/editorial/kombinler.webp",
      alt: "452WEAR kombinleri: askıda duran dört kombin ve sneaker'ları",
    },
    // Afişin üstündeki baskılı yazılar (başlık, alt yazı ve "01 DAILY" gibi
    // pano etiketleri; görselin üst ~%30'u) kadraj dışında kalır; kombinler
    // ve sneaker'lar görünür.
    focus: "center 93%",
  },
];

/**
 * Ayakkabılar ve Giyim karoları: büyük gerçek görsel, altta başlık, kısa
 * metin ve "Keşfet" düğmesi. Masaüstünde yan yana, mobilde alt alta.
 */
export function CategoryTiles() {
  return (
    <section className="pb-12 sm:pb-14">
      <Container className={`grid gap-4 sm:gap-5 lg:grid-cols-2 ${HOME_WIDTH}`}>
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group relative block aspect-4/5 overflow-hidden rounded-product bg-muted sm:aspect-video lg:aspect-4/5 xl:aspect-square"
          >
            <Image
              src={tile.image.src}
              alt={tile.image.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              style={{ objectPosition: tile.focus }}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 text-white sm:p-8">
              <div>
                <h2 className="font-sf text-[30px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[36px]">
                  {tile.title}
                </h2>
                <p className="mt-2 font-sf text-[15px] text-white/80">
                  {tile.text}
                </p>
              </div>
              <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-sf text-[13px] font-bold uppercase tracking-[0.04em] text-black transition-colors group-hover:bg-brand group-hover:text-white">
                Keşfet
                <ArrowRight className="size-4" strokeWidth={2.2} />
              </span>
            </div>
          </Link>
        ))}
      </Container>
    </section>
  );
}
