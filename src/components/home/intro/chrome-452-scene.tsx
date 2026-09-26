"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { GLYPHS_452 } from "./glyphs-452";
import { INTRO_END, INTRO_TIMING } from "./intro-timing";

/** Rakam biriminden sahne birimine ölçek (rakam yüksekliği ~100 birim). */
const UNIT = 0.01;

/** Fare parallax'ı: en fazla bu kadar radyan eğilir. */
const PARALLAX = { x: 0.09, y: 0.14 } as const;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
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

/** Rakam dış hatlarından tek parça, ortalanmış, bevelli 3B gövde. */
function use452Geometry() {
  return useMemo(() => {
    const shapes = GLYPHS_452.map((g) => {
      const shape = new THREE.Shape(
        g.outer.map(([x, y]) => new THREE.Vector2(x, y)),
      );
      shape.holes = g.holes.map(
        (h) => new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))),
      );
      return shape;
    });
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 16,
      curveSegments: 1,
      bevelEnabled: true,
      // İğne uçlarında kendi üstüne katlanmasın diye bevel ince tutulur;
      // kalınlık hissini derinlik verir.
      bevelThickness: 4,
      bevelSize: 1.5,
      bevelSegments: 5,
    });
    geometry.center();
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

function Chrome452({
  reduced,
  pointer,
  clock,
}: {
  reduced: boolean;
  pointer: React.RefObject<{ x: number; y: number }>;
  clock: IntroClock;
}) {
  const geometry = use452Geometry();
  const spin = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const t = clock.t;
    const T = INTRO_TIMING;

    // Silüetten krom parlaklığa: ortam yansıması yavaşça açılır. Sahne
    // ortamı kullanıldığında three.js material.envMapIntensity'yi değil
    // scene.environmentIntensity'yi okur.
    const light = reduced
      ? easeOutCubic(clamp01(t / 0.8))
      : easeOutCubic(clamp01((t - T.black) / T.lightUp));
    state.scene.environmentIntensity = 0.03 + light * 0.97;

    // Tek, yavaş 360° dönüş; bitişte tam karşıya bakar.
    if (spin.current) {
      const p = reduced ? 1 : clamp01((t - T.spinStart) / T.spinDuration);
      spin.current.rotation.y = easeInOutCubic(p) * Math.PI * 2;
    }

    // Fare ile çok hafif eğilme (yumuşak takip).
    if (tilt.current && pointer.current) {
      const k = 1 - Math.exp(-delta * 3);
      tilt.current.rotation.x +=
        (-pointer.current.y * PARALLAX.x - tilt.current.rotation.x) * k;
      tilt.current.rotation.y +=
        (pointer.current.x * PARALLAX.y - tilt.current.rotation.y) * k;
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin} scale={UNIT}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            // Gümüş, çok hafif buz mavisine çalan krom.
            color="#dfe9f5"
            metalness={1}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Krom yansımalarının kaynağı: HDRI yerine prosedürel stüdyo ışıkları.
 * Buz mavisi "sweep" şeridi intro sonunda soldan sağa geçer; yansıma
 * gerçek olduğu için ışık rakamların yüzeyinden kayarak geçer.
 */
function Studio({ reduced, clock }: { reduced: boolean; clock: IntroClock }) {
  // Süpürme bittikten sonra ortam sabit: küp harita her karede yeniden
  // çizilmez (mobilde GPU/pil tasarrufu).
  const [settled, setSettled] = useState(reduced);
  const sweep = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!settled && clock.t > INTRO_END + 0.3) setSettled(true);
    if (!sweep.current) return;
    const T = INTRO_TIMING;
    const start = T.spinStart + T.spinDuration - 0.15;
    const p = reduced ? 1 : clamp01((clock.t - start) / T.sweepDuration);
    // Düz ön yüzler kameraya göre yalnızca ±12°'lik bir açıyı yansıtır;
    // şerit o aralığı soldan sağa tarar.
    sweep.current.position.x = -4.5 + easeInOutCubic(p) * 9;
    sweep.current.visible = p > 0 && p < 1;
  });

  return (
    <Environment resolution={256} frames={settled ? 1 : Infinity}>
      {/* Kameranın arkasındaki "ufuk bantları": düz krom yüzlerde üstte
          parlak beyaz, ortada koyu, altta soğuk mavi bant. */}
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#ffffff"
        position={[0, 1.1, 10]}
        scale={[30, 0.9, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#dce9ff"
        position={[0, 0.25, 10]}
        scale={[30, 0.18, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.3}
        color="#7fb0f0"
        position={[0, -0.9, 10]}
        scale={[30, 0.7, 1]}
      />
      {/* Tepe ışığı: üst kenar ve bevellerde beyaz parlama */}
      <Lightformer
        form="rect"
        intensity={3}
        color="#ffffff"
        position={[0, 8, 2]}
        rotation-x={Math.PI / 2}
        scale={[16, 4, 1]}
      />
      {/* Yan ışıklar: dönüşte yan yüzler ve bevelde beyaz / buz mavisi */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#ffffff"
        position={[-9, 1, 1]}
        rotation-y={Math.PI / 2}
        scale={[3, 12, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#a9cdff"
        position={[9, -1, 1]}
        rotation-y={-Math.PI / 2}
        scale={[3, 12, 1]}
      />
      {/* Arka ışık: dönüşte arka yüz de ışığı yakalar */}
      <Lightformer
        form="rect"
        intensity={1.6}
        color="#cfe2ff"
        position={[0, 2, -10]}
        rotation-y={Math.PI}
        scale={[14, 1.2, 1]}
      />
      {/* Işık süpürmesi */}
      <Lightformer
        ref={sweep}
        form="rect"
        intensity={9}
        color="#d6eaff"
        position={[-4.5, 0, 10]}
        rotation-z={-0.3}
        scale={[0.45, 8, 1]}
      />
    </Environment>
  );
}

/**
 * Kamerayı sabit tutar; yalnızca ekran oranına göre uzaklığı ayarlar ki 452
 * masaüstünde büyük, mobilde ekrana sığacak şekilde görünsün.
 */
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    // 452'nin sahne ölçüleri (dönüşte taşmasın diye biraz pay bırakılır).
    const width = 3.4;
    const height = 1.5;
    const aspect = size.width / size.height;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const fillW = aspect < 0.8 ? 0.86 : 0.6;
    const fillH = 0.5;
    const distW = width / fillW / (2 * Math.tan(vFov / 2) * aspect);
    const distH = height / fillH / (2 * Math.tan(vFov / 2));
    cam.position.set(0, 0, Math.max(distW, distH));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
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
  const pointer = useRef({ x: 0, y: 0 });
  const [clock] = useState(() => new IntroClock());

  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ fov: 28, near: 0.1, far: 50, position: [0, 0, 8] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onError);
      }}
    >
      {/* Saat ilk sırada: aynı karede diğerlerinden önce ilerler. */}
      <IntroClockTicker clock={clock} />
      <FitCamera />
      <Studio reduced={reduced} clock={clock} />
      <Chrome452 reduced={reduced} pointer={pointer} clock={clock} />
    </Canvas>
  );
}
