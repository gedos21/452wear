"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
  useTexture,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BACKDROP_HORIZON,
  BACKDROP_URL,
  STUDIO_HDRI_URL,
} from "./backdrop";
import { GLYPHS_452 } from "./glyphs-452";
import { EXIT_TIMING, HERO_EXIT_EVENT, INTRO_TIMING } from "./intro-timing";

/** 452'nin sahnedeki genişliği (kamera uzaklığı buna göre ayarlanır). */
const LOGO_WIDTH = 3.3;

/**
 * Extrude ölçüleri, sahne biriminde (logo ~3.3 × 1.75). Toplam kalınlık
 * depth + 2 × bevelThickness = 0.29. Bevel içeri doğru açılır
 * (bevelOffset = -bevelSize): dış silüet SVG'nin birebir kendisi kalır,
 * ön yüz kenarlardan içeri çekilir. Bu ölçüde ince uçlarda yüzey kendi
 * üstüne katlanmıyor (ölçüldü); daha büyüğü uçları bozabilir.
 */
const EXTRUDE = {
  depth: 0.2,
  bevelThickness: 0.045,
  bevelSize: 0.045,
  bevelOffset: -0.045,
  bevelSegments: 8,
  curveSegments: 10,
} as const;

/**
 * Bu açıdan küçük kırılımlar yumuşak gölgelenir (bevel kademeleri, dış
 * hattın hafif köşeleri); daha keskinleri keskin kalır (sivri uçlar).
 */
const CREASE_ANGLE = THREE.MathUtils.degToRad(30);

/**
 * Sürükleyerek Y ekseninde döndürme (3B'yi elle test etmek için). Geliştirme
 * sunucusunda açık; canlıda yalnızca adrese ?drag452 eklenirse açılır.
 */
function dragEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return new URLSearchParams(window.location.search).has("drag452");
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * Intro saati: ilk çizilen kareden başlar ve kare başına en fazla 1/30 sn
 * ilerler. İlk karedeki shader derlemesi gibi takılmalar animasyonu
 * atlatmaz; siyah açılış ve ışık geçişi her cihazda görünür.
 */
class IntroClock {
  static MAX_STEP = 1 / 30;
  t = 0;
  tick(delta: number) {
    this.t += Math.min(delta, IntroClock.MAX_STEP);
  }
}

function IntroClockTicker({ clock }: { clock: IntroClock }) {
  useFrame((_, delta) => clock.tick(delta));
  return null;
}

/**
 * Bevel ve yan duvarları yumuşak, ön/arka yüzü düz gölgeler:
 * - Bevel kademeleri tek bir yuvarlak kenar gibi ışığı akıtır (basamak yok).
 * - Ön ve arka yüz tam düz kalır: yumuşatılmış kenar normali uzun kapak
 *   üçgenleri boyunca sürüklenip ayna gibi düz yüzeyde leke yapmasın diye.
 */
function smoothBevelNormals(geometry: THREE.BufferGeometry) {
  // toCreasedNormals konumları 0.01 hassasiyetle eşler; bevel kademeleri
  // bundan küçük olduğu için hesap 100 kat büyütülmüş gövdede yapılır.
  geometry.scale(100, 100, 100);
  toCreasedNormals(geometry, CREASE_ANGLE);
  geometry.scale(0.01, 0.01, 0.01);

  // ExtrudeGeometry grubu 0: ön ve arka kapak.
  const caps = geometry.groups.find((g) => g.materialIndex === 0);
  if (!caps) return;
  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  for (let i = caps.start; i < caps.start + caps.count; i++) {
    normal.setXYZ(i, 0, 0, Math.sign(pos.getZ(i)));
  }
  normal.needsUpdate = true;
}

/**
 * SVG logosundan tek parça, ortalanmış, bevelli 3B gövde. Ön yüz, yan
 * duvarlar, bevel ve arka yüz ExtrudeGeometry'nin gerçek geometrisidir.
 * SVG noktaları yalnızca ölçeklenir ve ortalanır; silüet değişmez.
 */
function use452Geometry() {
  return useMemo(() => {
    const pts = GLYPHS_452.flatMap((g) => g.outer);
    const minX = Math.min(...pts.map((p) => p[0]));
    const maxX = Math.max(...pts.map((p) => p[0]));
    const minY = Math.min(...pts.map((p) => p[1]));
    const maxY = Math.max(...pts.map((p) => p[1]));
    const k = LOGO_WIDTH / (maxX - minX);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    // SVG'de y aşağı, three.js'te yukarı: y ters çevrilir.
    const toVec = ([x, y]: [number, number]) =>
      new THREE.Vector2((x - cx) * k, -(y - cy) * k);

    const shapes = GLYPHS_452.map((g) => {
      const shape = new THREE.Shape(g.outer.map(toVec));
      shape.holes = g.holes.map((h) => new THREE.Path(h.map(toVec)));
      return shape;
    });
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      ...EXTRUDE,
      bevelEnabled: true,
    });
    // Derinlikte ortala: dönüş ekseni gövdenin tam ortasından geçer.
    geometry.translate(0, 0, -EXTRUDE.depth / 2);
    smoothBevelNormals(geometry);
    return geometry;
  }, []);
}

/**
 * Mavi yalnızca ışık ve yansıma olarak gelir; yüzeye doku, gürültü ya da
 * UV'ye bağlı hiçbir desen uygulanmaz. Hepsi yüzeyin bakış açısına bağlı:
 * - Fresnel: yüzey bakışa göre sığlaştıkça metalin yansıması hafifçe
 *   elektrik mavisine döner. Işık yansımayan yerde mavi de olmaz; kenara
 *   eklenen bir ışıma (rim glow) yoktur, o neon/oyuncak hissi verir.
 * Üstteki şeffaf vernik (clearcoat) renksiz kalır.
 */
const BLUE_LIGHT = {
  /** Açılı yüzeylerde metal yansımasının maviye dönme oranı (0 → hiç). */
  fresnel: 0.55,
  /** Fresnel eğrisi: büyüdükçe mavi yalnızca daha sığ açılarda görünür. */
  fresnelPower: 2.5,
  /** Metal yansımasının açılı yüzeylerdeki tonu (doğrusal renk). */
  tint: [0.3, 0.58, 1.3] as const,
} as const;

function patchBlueLight(shader: THREE.WebGLProgramParametersWithUniforms) {
  const B = BLUE_LIGHT;
  shader.uniforms.uBlueTint = { value: new THREE.Vector3(...B.tint) };
  shader.uniforms.uBlueFresnel = { value: B.fresnel };
  // Bakış yönüyle yüzey normali arasındaki açıdan: 0 karşıdan, 1 sıyırarak.
  const grazing =
    "(1.0 - saturate(dot(nonPerturbedNormal, normalize(vViewPosition))))";
  shader.fragmentShader =
    "uniform vec3 uBlueTint;\nuniform float uBlueFresnel;\n" +
    shader.fragmentShader.replace(
      "vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;",
      [
        "vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;",
        `  float blueFresnel = pow(${grazing}, ${B.fresnelPower.toFixed(1)});`,
        "  totalSpecular *= mix(vec3(1.0), uBlueTint, blueFresnel * uBlueFresnel);",
      ].join("\n"),
    );
}

/** Yerleşim, ekran yüksekliğine oranla (yukarıdan). */
const LAYOUT = {
  /** 452'nin merkezi: ortanın biraz üstü, zeminin üzerinde havada. */
  model: 0.41,
  /** Yansımanın başladığı zemin çizgisi: ufkun hemen altı. */
  floor: 0.79,
} as const;

/** Logonun yarı yüksekliği (sahne birimi; 3.3 × 1.75). */
const LOGO_HALF_HEIGHT = 0.88;

/**
 * Zemin yansıması: en fazla bu opaklık, bu mesafede söner. Pürüzlülük
 * ayna yerine ıslak zemin gibi hafif dağınık bir yansıma verir.
 */
const REFLECTION = { strength: 0.12, fade: 0.6, roughness: 0.3 } as const;

/** Materyal: parlatılmış gümüş krom; mavi yalnızca yansımadan gelir. */
const CHROME = {
  color: "#e6ebf1",
  metalness: 1,
  roughness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.03,
  ior: 1.5,
} as const;

/**
 * Kamera ve sahne yerleşimi: kamera düz bakar (dikeyler paralel) ve 452
 * ekranın ~%65'ini doldurur. Model ve zemin, arka planın ufkuyla uyumlu
 * ekran yüksekliklerine konur.
 */
function useStageLayout() {
  const { camera, size } = useThree();
  const layout = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const width = LOGO_WIDTH + 0.1;
    const height = 1.85;
    const aspect = size.width / size.height;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    // Dikey ekranda (mobil) 452 genişliğe göre sığar; sürekli döndüğü için
    // çoğu an yandan (daha dar) görünür, pay küçük tutulur.
    const fillW = aspect < 0.8 ? 0.93 : 0.65;
    const fillH = 0.62;
    const dist = Math.max(
      width / fillW / (2 * tanHalf * aspect),
      height / fillH / (2 * tanHalf),
    );
    // Model derinliğinde ekranın yarı yüksekliği (sahne birimi).
    const halfH = dist * tanHalf;
    const modelY = (0.5 - LAYOUT.model) * 2 * halfH;
    // Model her durumda zeminin biraz üstünde süzülür.
    const floorY = Math.min(
      (0.5 - LAYOUT.floor) * 2 * halfH,
      modelY - LOGO_HALF_HEIGHT - 0.08,
    );
    return { dist, modelY, floorY };
  }, [camera, size]);

  useEffect(() => {
    camera.position.set(0, 0, layout.dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, layout]);

  return layout;
}

/**
 * Zemin yansıması için krom: gerçek ayna kopyasında kullanılır, dünya
 * yüksekliğine göre zeminden aşağı doğru saydamlaşır.
 */
function createReflectionMaterial(floorY: number) {
  const mat = new THREE.MeshPhysicalMaterial({
    ...CHROME,
    roughness: REFLECTION.roughness,
    transparent: true,
    depthWrite: false,
  });
  // Giriş/çıkışta modelin opaklığını izler (useFrame'den güncellenir).
  const strength = { value: REFLECTION.strength };
  mat.userData.strength = strength;
  mat.onBeforeCompile = (shader) => {
    patchBlueLight(shader);
    shader.uniforms.uFloor = { value: floorY };
    shader.uniforms.uFade = { value: REFLECTION.fade };
    shader.uniforms.uStrength = strength;
    shader.vertexShader =
      "varying float vReflY;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n  vReflY = (modelMatrix * vec4(transformed, 1.0)).y;",
      );
    shader.fragmentShader =
      "uniform float uFloor;\nuniform float uFade;\nuniform float uStrength;\nvarying float vReflY;\n" +
      shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        "#include <dithering_fragment>\n  gl_FragColor.a *= uStrength * smoothstep(uFloor - uFade, uFloor, vReflY);",
      );
  };
  return mat;
}

/**
 * Giriş ve çıkışın o anki değerleri: 452'nin opaklığı/ölçeği ve arka planın
 * parlaklığı. Çıkış, ALIŞVERİŞE BAŞLA'ya basıldığı saat anından (exitAt)
 * itibaren işler.
 */
function stageFade(t: number, reduced: boolean, exitAt: number | null) {
  const T = INTRO_TIMING;
  const E = EXIT_TIMING;
  let model = 1;
  let scale = 1;
  let backdrop = 1;
  if (!reduced) {
    const p = clamp01(t / T.entry);
    // ~0.3 sn'de yarı opaklık, 0.7 sn'de tam; ölçek çok az, yumuşak.
    model = Math.pow(p, 0.8);
    scale = T.entryScale + (1 - T.entryScale) * easeOutCubic(p);
    backdrop = easeOutCubic(clamp01(t / T.backdropFade));
  }
  if (exitAt !== null) {
    const e = t - exitAt;
    model *= 1 - easeOutCubic(clamp01(e / E.model));
    backdrop *= 1 - easeOutCubic(clamp01((e - E.backdropDelay) / E.backdrop));
  }
  return { model, scale, backdrop };
}

function Chrome452({
  reduced,
  drag,
  clock,
  exitAt,
}: {
  reduced: boolean;
  drag: React.RefObject<number>;
  clock: IntroClock;
  exitAt: React.RefObject<number | null>;
}) {
  const { modelY, floorY } = useStageLayout();
  const geometry = use452Geometry();
  // Zemin yüksekliği yalnızca ekran boyutu değişince değişir.
  const reflectionMaterial = useMemo(
    () => createReflectionMaterial(floorY),
    [floorY],
  );
  const spin = useRef<THREE.Group>(null);
  const mirrorSpin = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>>(null);
  const mirror = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>>(null);
  const angle = useRef(0);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => reflectionMaterial.dispose(), [reflectionMaterial]);

  useFrame((state, delta) => {
    // Giriş / çıkış: 452 belirir (hafif büyüyerek), arka plan siyahtan açılır.
    const fade = stageFade(clock.t, reduced, exitAt.current);
    state.scene.backgroundIntensity = fade.backdrop;
    if (body.current) {
      // Saydamlık yalnızca solma sırasında açık: kalıcı saydam krom, koyu
      // zeminle harmanlanıp kararır.
      const mat = body.current.material;
      const fading = fade.model < 0.999;
      if (mat.transparent !== fading) {
        mat.transparent = fading;
        mat.needsUpdate = true;
      }
      mat.opacity = fade.model;
    }
    if (mirror.current) {
      mirror.current.material.userData.strength.value =
        REFLECTION.strength * fade.model;
    }

    // Gerçek 3B dönüş: 452 mesh'inin grubu (spin) Y ekseninde, ilk kareden
    // itibaren sabit hızla ve sonsuz döner (tam karşıdan başlar; her turda
    // aynı açıya döner). Kamera sabit. Yalnızca prefers-reduced-motion
    // açıkken durur. Sekme arka plandan dönünce sıçramasın diye kare adımı
    // sınırlanır. Sürükleme açısı üstüne eklenir.
    if (!reduced) {
      const speed = (Math.PI * 2) / INTRO_TIMING.spinPeriod;
      angle.current =
        (angle.current + Math.min(delta, 0.1) * speed) % (Math.PI * 2);
    }
    const y = angle.current + (drag.current ?? 0);
    if (spin.current) {
      spin.current.rotation.y = y;
      spin.current.scale.setScalar(fade.scale);
    }
    if (mirrorSpin.current) {
      mirrorSpin.current.rotation.y = y;
      mirrorSpin.current.scale.setScalar(fade.scale);
    }
  });

  return (
    <>
      <group position={[0, modelY, 0]}>
        <group ref={spin}>
          <mesh ref={body} geometry={geometry}>
            <meshPhysicalMaterial
              {...CHROME}
              onBeforeCompile={patchBlueLight}
            />
          </mesh>
        </group>
      </group>
      {/* Islak zemindeki yansıma: modelin zemine göre ayna kopyası. */}
      <group position={[0, 2 * floorY - modelY, 0]} scale={[1, -1, 1]}>
        <group ref={mirrorSpin}>
          <mesh ref={mirror} geometry={geometry} material={reflectionMaterial} />
        </group>
      </group>
    </>
  );
}

/**
 * Arka planı 452'nin gerisine iter (görselin kendisi değişmez, yalnızca
 * sahnede böyle gösterilir): hafif alan derinliği bulanıklığı, daha düşük
 * kontrast, biraz daha karanlık; 452'nin arkasındaki merkez daha da koyu.
 */
const BACKDROP_TREATMENT = {
  /** Bulanıklık: görsel bu orana küçültülüp geri büyütülür. */
  blurScale: 0.4,
  /** Kontrastı düşüren koyu mavi-gri örtü. */
  haze: "rgba(14, 20, 30, 0.16)",
  /** Genel karartma. */
  darken: 0.22,
  /** 452'nin arkasındaki merkez karartması (görselde yukarıdan oran). */
  center: { y: 0.42, radius: 0.42, alpha: 0.5 },
} as const;

function softenBackdrop(img: HTMLImageElement): HTMLCanvasElement {
  const { width: w, height: h } = img;
  const B = BACKDROP_TREATMENT;
  const small = document.createElement("canvas");
  small.width = Math.round(w * B.blurScale);
  small.height = Math.round(h * B.blurScale);
  const sctx = small.getContext("2d")!;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(img, 0, 0, small.width, small.height);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, w, h);
  ctx.fillStyle = B.haze;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `rgba(0, 0, 0, ${B.darken})`;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * B.center.y;
  const vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * B.center.radius);
  vignette.addColorStop(0, `rgba(0, 0, 0, ${B.center.alpha})`);
  vignette.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  return out;
}

/**
 * Arka plan görseli, sahnenin arka planı olarak "cover" kırpılır. Ufuk
 * çizgisi her ekran oranında aynı yükseklikte kalır (3B zeminle uyumlu).
 */
function Backdrop() {
  const source = useTexture(BACKDROP_URL);
  const size = useThree((s) => s.size);
  const softened = useMemo(
    () => softenBackdrop(source.image as HTMLImageElement),
    [source],
  );

  // Ekran oranına göre kırpılmış doku (işlenmiş görsel paylaşılır).
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(softened);
    tex.colorSpace = THREE.SRGBColorSpace;
    const img = softened;
    const imgAspect = img.width / img.height;
    const aspect = size.width / size.height;
    if (aspect > imgAspect) {
      // Ekran daha geniş: üstten/alttan kırp, ufuk sabit kalsın.
      const ry = imgAspect / aspect;
      tex.repeat.set(1, ry);
      tex.offset.set(0, (1 - BACKDROP_HORIZON) * (1 - ry));
    } else {
      // Ekran daha dar: yanlardan ortalı kırp.
      const rx = aspect / imgAspect;
      tex.repeat.set(rx, 1);
      tex.offset.set((1 - rx) / 2, 0);
    }
    tex.needsUpdate = true;
    return tex;
  }, [softened, size]);
  useEffect(() => () => texture.dispose(), [texture]);

  return <primitive attach="background" object={texture} />;
}

/**
 * Kameranın tam arkası (+z, RING_RADIUS uzaklıkta). Düz ön yüz bir ayna
 * gibi bu duvarın yalnızca küçük bir penceresini yansıtır: yaklaşık
 * x ∈ [-1.4, 1.4], y ∈ [-0.5, 1.0] (logonun solu solu, üstü üstü görür).
 * Pencerenin içi sinematik bir krom geçişi: sol üstte yumuşak beyaz key
 * (arka plandaki çapraz ışınla aynı yön), altta koyu çelik, sağ altta çok
 * hafif buz mavisi, ortadan geçen ince beyaz bir parlama çizgisi.
 * rot verilen ışıklar merkeze dönmek yerine o açıyla eğilir.
 */
const FRONT_SOFTBOXES: {
  x: number;
  y: number;
  w: number;
  h: number;
  i: number;
  color: string;
  rot?: number;
}[] = [
  // Koyu çelik taban (gölgeler koyu gümüş).
  { x: 0, y: 0, w: 24, h: 20, i: 1.35, color: "#b4c1d0" },
  // Key: sol üst, geniş ve yumuşak.
  { x: -1.4, y: 1.2, w: 3.6, h: 2.6, i: 4.2, color: "#f2f6ff" },
  // Sağ üstte daha zayıf ikinci beyaz.
  { x: 1.5, y: 1.1, w: 2.2, h: 1.4, i: 1.6, color: "#e8eef7" },
  // Sağ altta çok hafif buz mavisi yansıma.
  { x: 1.1, y: -0.7, w: 3, h: 1.3, i: 0.8, color: "#6aa6ff" },
  // Ortadan çapraz geçen ince beyaz parlama çizgisi.
  { x: 0.3, y: 0.3, w: 0.14, h: 3, i: 3, color: "#ffffff", rot: 0.55 },
];

/**
 * Model dönerken ön yüz, bevel ve yan duvarların sırayla yakaladığı dikey
 * şeritler. Açı 0 = kameranın arkası (+z), derece cinsinden.
 */
const STUDIO_RING = [
  { deg: -27, y: 0, w: 0.6, h: 14, i: 2.3, color: "#ffffff" },
  { deg: 24, y: 0, w: 0.4, h: 14, i: 1.8, color: "#8fc4ff" },
  { deg: 62, y: 1, w: 2.4, h: 10, i: 1.4, color: "#e8f0ff" },
  { deg: -68, y: 0, w: 0.5, h: 14, i: 1.6, color: "#9ccaff" },
  { deg: 90, y: 0, w: 3, h: 12, i: 1.1, color: "#e8f0ff" },
  { deg: -90, y: 0, w: 1.6, h: 12, i: 1.2, color: "#9ccaff" },
  { deg: 118, y: 0, w: 2.4, h: 10, i: 0.9, color: "#e8f0ff" },
  { deg: -118, y: 0, w: 2.8, h: 10, i: 0.9, color: "#ffffff" },
] as const;

/** Halkanın yarıçapı (ortam küp haritası içinde). */
const RING_RADIUS = 10;

/**
 * Gerçek stüdyo HDRI'ı (Poly Haven "Studio Small 03", CC0): koyu küçük
 * stüdyo, parlak şemsiye softbox ve tavan lambası. Kromun yansıttığı
 * ortamın tabanıdır; prosedürel ışıklar (key, mavi şeritler) önünde kalır.
 * Sahnede görünmez, yalnızca yansır. Parlaklığı kısılır ve tonu hafif
 * soğuğa çekilir ki sahne karanlık ve mavi kalsın.
 */
const STUDIO_HDRI = {
  url: STUDIO_HDRI_URL,
  /** Işık halkasının gerisinde kalacak kadar büyük küre. */
  radius: 40,
  /** Parlaklık ve ton çarpanı (doğrusal renk; mavi kanal biraz fazla). */
  tint: new THREE.Color(0.3, 0.33, 0.38),
  /** Softbox'ın kromda nerede parlayacağı (Y ekseni etrafında, radyan). */
  rotation: 2.4,
} as const;

/** Bu genişlikten dar ışıklar keskin kenarlı şerit, genişler yumuşak softbox. */
const SOFT_MIN_WIDTH = 1.5;

/**
 * Softbox ışık dağılımı: ortası dolu, kenarlara doğru yumuşakça sönen
 * dikdörtgen. Yansımalar düz renk lekesi yerine gerçek stüdyo ışığı gibi
 * geçişli görünür.
 */
function createSoftboxMap() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const falloff = (u: number) => {
    // 0 kenar, 1 merkez; kenardan %35 içeride tam parlaklık.
    const d = 1 - Math.abs(u * 2 - 1);
    const t = Math.min(1, d / 0.7);
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = falloff((x + 0.5) / size) * falloff((y + 0.5) / size) * 255;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Krom yansımalarının kaynağı: arka plan görselinin ışık yönlerine göre
 * kurulmuş karanlık prosedürel stüdyo. Işıklar sahnede görünmez, yalnızca
 * kromun yüzeyinde yansır. Ortam sabit: küp harita bir kez çizilir.
 *
 * 1. Key: sol üstten büyük, yumuşak soğuk beyaz (arka plandaki çapraz ışın).
 * 2. Rim: arkadan buz mavisi; dış kenarlarda ince mavi çizgi.
 * 3. Zemin: alttan düşük mavi dolgu ve ufuk hizasında yatay mavi şerit.
 * 4. Tepe: çok düşük beyaz; krom tamamen kararmasın.
 */
function Studio({
  reduced,
  clock,
  touch,
}: {
  reduced: boolean;
  clock: IntroClock;
  /** Dokunmatik cihaz: ortam haritası daha düşük çözünürlükte çizilir. */
  touch: boolean;
}) {
  const hdri = useLoader(HDRLoader, STUDIO_HDRI.url);
  const soft = useMemo(() => createSoftboxMap(), []);
  useEffect(() => () => soft.dispose(), [soft]);
  const mapFor = (w: number) => (w >= SOFT_MIN_WIDTH ? soft : undefined);

  // Işık süpürmesi bitene kadar ortam her karede yeniden çizilir; sonra
  // sabitlenir (mobilde GPU/pil tasarrufu).
  const [settled, setSettled] = useState(reduced);
  const sweep = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const T = INTRO_TIMING;
    const p = clamp01((clock.t - T.sweepStart) / T.sweepDuration);
    if (sweep.current) {
      // Ön yüzün yansıttığı koniyi soldan sağa tarar.
      sweep.current.position.x = -5 + easeInOutSine(p) * 10;
      sweep.current.visible = p > 0 && p < 1;
    }
    if (!settled && p >= 1) setSettled(true);
  });

  return (
    <Environment
      // Telefonda 256: girişteki her kare yeniden çizimde işin dörtte biri;
      // küçük ekranda fark edilmez.
      resolution={touch ? 256 : 512}
      frames={settled ? 1 : Infinity}
    >
      {/* Gerçek stüdyo: ortamın tabanı, her yönden gerçekçi yansıma. */}
      <mesh scale={STUDIO_HDRI.radius} rotation-y={STUDIO_HDRI.rotation}>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial
          map={hdri}
          side={THREE.BackSide}
          color={STUDIO_HDRI.tint}
          toneMapped={false}
        />
      </mesh>
      {/* Giriş ışık süpürmesi: ince buz mavisi şerit, patlama yok. */}
      {!reduced && (
        <Lightformer
          ref={sweep}
          form="rect"
          intensity={2.6}
          color="#bfe0ff"
          position={[-5, 0, RING_RADIUS - 0.4]}
          scale={[0.35, 12, 1]}
          visible={false}
        />
      )}
      {FRONT_SOFTBOXES.map((b, i) => (
        <Lightformer
          key={`front-${i}`}
          form="rect"
          intensity={b.i}
          color={b.color}
          map={mapFor(b.w)}
          // Arkadaki geniş dolgu en uzakta: öndeki kutular üstte kalır.
          position={[b.x, b.y, RING_RADIUS - i * 0.05]}
          rotation={b.rot === undefined ? undefined : [0, 0, b.rot]}
          scale={[b.w, b.h, 1]}
        />
      ))}
      {STUDIO_RING.map((s) => {
        const a = THREE.MathUtils.degToRad(s.deg);
        return (
          <Lightformer
            key={s.deg}
            form="rect"
            intensity={s.i}
            color={s.color}
            map={mapFor(s.w)}
            position={[
              Math.sin(a) * RING_RADIUS,
              s.y,
              Math.cos(a) * RING_RADIUS,
            ]}
            scale={[s.w, s.h, 1]}
          />
        );
      })}
      {/* 1. Key: sol üst, büyük ve yumuşak. */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#dce9ff"
        map={soft}
        position={[-6.5, 6.5, 3]}
        scale={[7, 7, 1]}
      />
      {/* Arka plandaki sol üst çapraz mavi ışın: kromda ince elektrik mavisi
          bir şerit olarak yansır. */}
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#3d86ff"
        position={[-4.2, 3.4, 8.2]}
        scale={[0.3, 9, 1]}
      />
      {/* 2. Rim: arkadan geniş buz mavisi + iki ince kenar şeridi. */}
      <Lightformer
        form="rect"
        intensity={1.4}
        color="#7fb6f5"
        map={soft}
        position={[0, 0.5, -RING_RADIUS]}
        scale={[16, 7, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#8fc4ff"
        position={[-5.5, 0, -8]}
        scale={[0.5, 14, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2}
        color="#a8d2ff"
        position={[5.5, 0, -8]}
        scale={[0.5, 14, 1]}
      />
      {/* 3. Zemin: alttan düşük mavi dolgu ve ufuk hizasında yatay şerit. */}
      <Lightformer
        form="rect"
        intensity={0.7}
        color="#5f9be0"
        map={soft}
        position={[0, -9, 0]}
        scale={[14, 14, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#8fc4ff"
        position={[0, -1.6, RING_RADIUS]}
        scale={[18, 0.22, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.6}
        color="#8fc4ff"
        position={[0, -1.6, -RING_RADIUS]}
        scale={[18, 0.22, 1]}
      />
      {/* 4. Tepe: çok düşük beyaz. */}
      <Lightformer
        form="rect"
        intensity={0.6}
        color="#ffffff"
        map={soft}
        position={[0, 9, 0]}
        scale={[9, 9, 1]}
      />
    </Environment>
  );
}

/** Çok hafif bloom: yalnızca en parlak kenar parlamaları çok az taşar. */
function SoftBloom() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.97}
        luminanceSmoothing={0.03}
        intensity={0.07}
        radius={0.35}
      />
    </EffectComposer>
  );
}

export default function Chrome452Scene({
  reduced,
  active,
  onError,
}: {
  reduced: boolean;
  /** Hero ekranda değilken çizim durur (pil/performans). */
  active: boolean;
  onError: () => void;
}) {
  const drag = useRef(0);
  const exitAt = useRef<number | null>(null);
  const [canDrag] = useState(dragEnabled);
  const [clock] = useState(() => new IntroClock());
  // Dokunmatik cihazlarda (telefon/tablet) daha hafif ayarlar.
  const [touch] = useState(
    () => window.matchMedia("(pointer: coarse)").matches,
  );
  // Piksel yoğunluğu üst sınırı. Cihaz kare hızını tutturamazsa
  // (PerformanceMonitor) 1'e iner: zayıf telefonda keskinlik yerine akıcılık.
  const [maxDpr, setMaxDpr] = useState(touch ? 1.5 : 2);
  const lowerDpr = () => setMaxDpr(1);

  // ALIŞVERİŞE BAŞLA: önce 452, ardından arka plan söner (bkz. hero-cta).
  useEffect(() => {
    const onExit = () => {
      exitAt.current ??= clock.t;
    };
    window.addEventListener(HERO_EXIT_EVENT, onExit);
    return () => window.removeEventListener(HERO_EXIT_EVENT, onExit);
  }, [clock]);

  // Sağa sürükleyince model Y ekseninde sağa döner (ekran genişliği = 1 tur).
  const dragHandlers = canDrag
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) =>
          e.currentTarget.setPointerCapture(e.pointerId),
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          drag.current +=
            (e.movementX / e.currentTarget.clientWidth) * Math.PI * 2;
        },
        style: { cursor: "grab", touchAction: "none" } as const,
      }
    : {};

  return (
    <Canvas
      {...dragHandlers}
      frameloop={active ? "always" : "never"}
      dpr={[1, maxDpr]}
      camera={{ fov: 26, near: 0.1, far: 50, position: [0, 0, 8] }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        // Neutral: beyaz parlamaları soldurmaz, buz mavisini mora kaydırmaz.
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onError);
      }}
    >
      <PerformanceMonitor
        onDecline={lowerDpr}
        onFallback={lowerDpr}
        flipflops={3}
      />
      {/* Arka plan görseli ve stüdyo HDRI'ı yüklenene kadar sahne siyah
          bekler; intro saati de ancak o zaman işlemeye başlar. Böylece
          giriş animasyonu yarım kalmaz, 452 ortamı olmadan (kararmış)
          görünmez. */}
      <Suspense fallback={null}>
        {/* Saat ilk sırada: aynı karede diğerlerinden önce ilerler. */}
        <IntroClockTicker clock={clock} />
        <Backdrop />
        <Studio reduced={reduced} clock={clock} touch={touch} />
        <Chrome452
          reduced={reduced}
          drag={drag}
          clock={clock}
          exitAt={exitAt}
        />
      </Suspense>
      <SoftBloom />
    </Canvas>
  );
}
