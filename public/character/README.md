# Karakter try-on asset'leri

Karakter, üst üste bindirilen şeffaf PNG katmanlarından oluşur:

```
base/front.png  →  bottoms/<dosya>.png  →  tops/<dosya>.png
```

Kaynak: 452WEAR karakter sheet'i (pixel fit preview). Sheet'teki dört
figür ortak bir çerçevede hizalanıp katmanlara ayrıldı; karakterin kendisi
(kafa, saç, yüz, kollar, bacaklar, ayakkabılar) yalnızca `base/front.png`
içinde bulunur ve kıyafet değişirken hiç değişmez.

## Canvas sözleşmesi

Tek kaynak: `src/lib/character.ts` → `CHARACTER_CANVAS`.

| Kural | Değer |
| --- | --- |
| Canvas | **176 × 384 px** |
| Format | PNG, şeffaf arka plan |
| Anchor | Katman canvas'ın tamamını kaplar; kıyafetin yeri asset'in kendi şeffaflığıyla belirlenir |
| Hizalama | Tüm katmanlar aynı kaynak çerçeveden aynı ölçekle indirgendi; ek offset yok |

Ekranda `pixelated` ile büyütülür (mobil 384px = 1×, masaüstü ~468px ≈ 1,2×),
böylece tarayıcı interpolasyonu devreye girmez.

## Mevcut asset'ler

| Dosya | İçerik | Durum |
| --- | --- | --- |
| `base/front.png` | Karakter + referans kargo pantolon + ayakkabı | aktif |
| `tops/tshirt-white.png` | Kırık beyaz oversize tişört | aktif |
| `tops/tshirt-black.png` | Siyah oversize tişört | aktif |
| `tops/tshirt-washed.png` | Yıkanmış/acid antrasit tişört | aktif |
| `tops/sweatshirt.png` | Siyah bisiklet yaka sweatshirt | **bu aşamada bağlı değil** |
| `tops/zip-hoodie.png` | Siyah fermuarlı kapüşonlu | **bu aşamada bağlı değil** |
| `bottoms/cargo-pants.png` | Referans kargo pantolon | **bu aşamada bağlı değil** |

## Şu an bağlı ürünler (tişört aşaması)

Bu aşamada yalnızca **3 gerçek tişört** bağlıdır; sweatshirt, hırka ve
pantolon try-on dışıdır (dosyalar duruyor, ürün bağlaması yok).

| Ürün | Katman | Katalog fiyatı |
| --- | --- | --- |
| Oversize Tişört (`p-001`, Siyah) | `tops/tshirt-black.png` | ₺749 |
| Eye & Dagger Tişört (`p-006`, Kırık Beyaz) | `tops/tshirt-washed.png` | ₺599 |
| Basic Tişört (`p-007`, Beyaz) | `tops/tshirt-white.png` | ₺549 |

Üç tişört de aynı kaynak çiziminden, **tek bir ölçek/konum dönüşümüyle**
üretildi (kaynakta 474×474 → canvas'ta 137×137, konum 19,86), bu yüzden
içerik bantları birebir aynı: `y 87..222`. Aralarında geçiş yapıldığında
karakter üzerinde kaymazlar.

Pantolonun `bottoms/` katmanı devre dışı olduğu için karakterde base'in
kendi referans kargo pantolonu görünür.

## Bir ürüne katman bağlama

Asset'i ilgili klasöre koy, ardından ürün datasında (`src/data/products.ts`)
tek alan doldur:

```ts
tryOn: { layer: "top", asset: "/character/tops/tshirt.png", status: "approved" }
```

`status: "approved"` olmayan katman mağazada çizilmez. `layer`, ürünün
kategorisine uymalıdır (eşofman → `bottom`, tişört/sweatshirt/hırka → `top`);
uymayan katman çizilmez. Admin panelinden (Pixel Fit Asset) yüklenen PNG bu
alanları kendisi doldurur.

Alan yoksa ürün normal ürün olarak çalışmaya devam eder; karakterde yalnızca
o katman çizilmez. Kırık görsel veya yer tutucu gösterilmez.
