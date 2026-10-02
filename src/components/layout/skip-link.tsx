/**
 * Sayfanın ana içeriğinin kimliği. Her sayfanın <main>'i bunu taşır
 * (tabIndex={-1} ile birlikte: bağlantıya basılınca odak gerçekten içeriğe
 * geçer, ekran okuyucu oradan devam eder).
 */
export const MAIN_CONTENT_ID = "icerik";

/**
 * "İçeriğe geç": klavyeyle ilk Tab'da görünen, menüyü atlayıp doğrudan
 * sayfanın içeriğine götüren bağlantı. Odakta değilken görünmez.
 */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
    >
      İçeriğe geç
    </a>
  );
}
