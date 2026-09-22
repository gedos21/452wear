/**
 * Metin yardımcıları — arama sonucu ve paylaşım önizlemesi için.
 */

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
