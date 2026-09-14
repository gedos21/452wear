import Image from "next/image";
import { CHARACTER_CANVAS } from "@/lib/character";
import { cn } from "@/lib/utils";

/**
 * Katman sisteminin tek çizim ilkesi.
 *
 * Her katman canvas'ın tamamını kaplar (`absolute inset-0`) ve aynı
 * `object-contain` kutusunu kullanır; hizalama asset'in kendi şeffaflığından
 * gelir. Base ile kıyafetler bu bileşeni paylaştığı için anchor'ları
 * kaçamaz.
 *
 * `unoptimized`: Next görsel optimizasyonu pixel-art'ı yeniden örnekleyip
 * yumuşatır. Asset zaten birkaç KB olduğu için ham dosya servis edilir ve
 * `pixelated` ile keskin büyütülür.
 */
export function CharacterLayer({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={CHARACTER_CANVAS.width}
      height={CHARACTER_CANVAS.height}
      unoptimized
      // Katmanlar sonuç ekranının odak öğesi ve hepsi aynı anda görünmeli;
      // lazy yükleme kıyafetin gövdeden sonra belirmesine yol açıyor.
      loading="eager"
      draggable={false}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full select-none object-contain pixelated",
        className,
      )}
    />
  );
}
