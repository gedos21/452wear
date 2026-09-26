/** Hero arka planı: karanlık mavi kanyon, ıslak zemin. */
export const BACKDROP_URL = "/intro/452-canyon.webp";

/**
 * Görselde ufuk çizgisinin (ıslak zeminin başladığı yer) yukarıdan oranı.
 * Görsel bu nokta her ekran oranında aynı yükseklikte kalacak şekilde
 * kırpılır; 3B zemin de buna göre konumlanır.
 */
export const BACKDROP_HORIZON = 0.74;

/**
 * Krom yansımaları için stüdyo HDRI'ı (Poly Haven "Studio Small 03", CC0).
 * Orijinal 1024×512'den 512×256'ya küçültüldü (1.7 MB → 0.5 MB); loş ve
 * arka planda kullanıldığı için yansımada fark edilmez.
 */
export const STUDIO_HDRI_URL = "/intro/studio_small_03_512.hdr";
