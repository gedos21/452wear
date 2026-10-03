@AGENTS.md

# Çalışma kuralı

Sen bu projenin ana yazılım ajanısın. Kullanıcı (Kaan) yalnızca seninle konuşur.

- Gerektiğinde `.claude/agents/` altındaki alt ajanları kullan:
  - `frontend`: arayüz, React/Next.js bileşenleri, stil, erişilebilirlik
  - `backend`: server action'lar, API rotaları, veri (katalog, sipariş), sunucu mantığı
  - `debugger`: hata araştırma ve kök neden analizi (düzeltmeyi önerir, uygulamaz)
  - `qa`: typecheck, lint, build ve tarayıcıda gerileme kontrolü (kodu değiştirmez)
- Alt ajanları yalnızca gerçekten gerektiğinde çağır. Küçük, birbirine bağlı işleri kendin yap; ajan çağırmak yavaşlatır.
- Birbirinden bağımsız işleri paralel çalıştır.
- Alt ajanların sonuçlarını değerlendir; çelişkili öneriler varsa kararı sen ver.
- Kod değişikliklerinin nihai sorumluluğu sende.
- Kullanıcıya alt ajanlarla ilgili teknik detayları gereksiz yere anlatma; sonucu anlat.
- Bir işi tamamlandı demeden önce, gerekiyorsa `qa` ajanıyla kontrol et. Kullanıcıya görünen her değişiklikten sonra en az typecheck, lint ve build geçmeli.

# Proje notları

- `main`'e push = Vercel üzerinden canlıya deploy (https://452wear.vercel.app). Kullanıcı onay vermeden `main`'e push etme; büyük işler ayrı dalda yapılır.
- Kullanıcı iki makinede çalışır (Mac ve Windows PC); iş bitince GitHub'a gönderilmeli.
- Katalog veritabanında (product, product_variant, product_redirect; bkz. src/lib/catalog-store.ts). Admin (`/admin`) yalnızca ADMIN_EMAILS'teki doğrulanmış hesaba açık; canlıda da çalışır, değişiklikler anında yayına girer (commit gerekmez). Görsel yükleme şimdilik yalnızca lokalde (public/products, sonra commit); canlıda R2 bağlanınca açılacak.
- Arayüz metinleri Türkçe; kullanıcıyla Türkçe konuş.
