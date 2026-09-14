# React Bits

React Bits bileşenleri kopyala-yapıştır mantığıyla çalışır; `components.json` içine
`@reactbits` registry'si tanımlı olduğu için shadcn CLI ile çekilebilirler.

## Bileşen ekleme

```bash
# İsim formatı: <Component>-TS-TW  (TypeScript + Tailwind varyantı)
npx shadcn@latest add @reactbits/SplitText-TS-TW
```

CLI dosyayı `src/components/<Component>/` altına yazar ve gerekli bağımlılıkları
(ör. `gsap`) otomatik kurar. Ardından dosyayı bu klasöre taşı ve barrel'a ekle:

```bash
mv src/components/SplitText/SplitText.tsx src/components/react-bits/split-text.tsx
rmdir src/components/SplitText
```

`src/components/react-bits/index.ts` içine export satırını ekle ki proje geneli
tek yerden import etsin:

```ts
export { default as SplitText } from "./split-text";
```

## Kurallar

- React Bits bileşenleri istemci tarafında animasyon yapar → dosyanın başında
  `"use client"` olduğundan emin ol (registry sürümlerinde bazen eksik gelir).
- Bileşeni projeye uydururken doğrudan düzenle; bunlar bizim dosyalarımız,
  upstream'den güncelleme beklemiyoruz.
- Katalog: https://reactbits.dev

## Projedeki uyarlamalar

- **TiltedCard** — demo tooltip'i, "mobile warning" metni ve gömülü `<img>`
  kaldırıldı; kart artık `children` alıyor.
- **Lanyard** — orijinali three.js + @react-three/rapier üzerinde çalışıyor ve
  React Bits'in göndermediği bir `card.glb` modeline bağlı. Aynı etkileşim
  modeli (tut → sürükle → bırak → sönümlü salınım) DOM + CSS 3B ile kuruldu:
  kart içeriği gerçek HTML olduğu için tipografi keskin kalıyor ve sayfaya
  ~2MB'lık 3D bağımlılık binmiyor.
