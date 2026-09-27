/**
 * Metin yardımcıları — arama sonucu, paylaşım önizlemesi ve Türkçe ekler.
 */

const BIRLER = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

/** Sayı okunurken söylenen SON kelime (1.200 → "yüz", 999 → "dokuz"). */
function sonOkunus(n: number): string {
  if (n === 0) return "sıfır";
  if (n % 10) return BIRLER[n % 10];
  if (n % 100) return ONLAR[(n % 100) / 10];
  if (n % 1000) return "yüz";
  if (n % 1_000_000) return "bin";
  if (n % 1_000_000_000) return "milyon";
  return "milyar";
}

/**
 * Sayıya gelen Türkçe ek, sayının okunuşuna göre (ünlü uyumu ve ünsüz
 * benzeşmesi): sayiEki(1200, "den") → "den" (bin iki yüz), sayiEki(999,
 * "den") → "dan" (dokuz yüz doksan dokuz), sayiEki(14, "e") → "e",
 * sayiEki(10, "e") → "a". Ondalıklı sayıda ek, ondalık kısmın okunuşuna
 * uyar (999,90 → "doksan"). Kullanım: `${fiyat}'${sayiEki(n, "den")}`.
 */
export function sayiEki(sayi: number, ek: "den" | "e"): string {
  const kurus = Math.round((Math.abs(sayi) % 1) * 100);
  const kelime = sonOkunus(kurus || Math.floor(Math.abs(sayi)));
  const sonUnlu = [...kelime].reverse().find((h) => "aeıioöuü".includes(h));
  const kalin = sonUnlu !== undefined && "aıou".includes(sonUnlu);
  const sonHarf = kelime.at(-1) ?? "";
  if (ek === "e") {
    const unlu = kalin ? "a" : "e";
    return "aeıioöuü".includes(sonHarf) ? `y${unlu}` : unlu;
  }
  const sert = "fstkçşhp".includes(sonHarf);
  return `${sert ? "t" : "d"}${kalin ? "an" : "en"}`;
}

/**
 * Uzun ürün açıklamasını tek satırlık özete indirir: satır sonları boşluğa
 * çevrilir, baştaki "Açıklama:" gibi etiketler atılır ve metin kelime
 * sınırında kesilir. Google açıklamanın ilk ~155 karakterini gösterdiği için
 * varsayılan sınır odur.
 */
export function ozetMetin(metin: string, sinir = 155): string {
  const duz = metin
    .replace(/^\s*a[çc]ıklama\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (duz.length <= sinir) return duz;
  const kesik = duz.slice(0, sinir);
  const son = kesik.lastIndexOf(" ");
  return `${(son > sinir * 0.6 ? kesik.slice(0, son) : kesik).trimEnd()}…`;
}
