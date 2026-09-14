import { CharacterLayer } from "./character-layer";
import {
  baseAsset,
  DEFAULT_CHARACTER,
  DEFAULT_VIEW,
  type CharacterId,
  type CharacterView,
} from "@/lib/character";

/**
 * Kıyafetsiz temel gövde: kafa, saç, yüz, boyun, gövde, kollar, eller,
 * bacaklar, ayaklar. Kıyafet içermez ve kombin değişse de hiç değişmez.
 *
 * `character` ve `view` ileride farklı karakter / side / back eklemek için
 * ayrıldı; şu an tek karakterin FRONT görünümü var.
 */
export function CharacterBase({
  character = DEFAULT_CHARACTER,
  view = DEFAULT_VIEW,
}: {
  character?: CharacterId;
  view?: CharacterView;
}) {
  return <CharacterLayer src={baseAsset(character, view)} />;
}
