"use client";

import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { GLYPHS_452 } from "./glyphs-452";

/**
 * Hero'daki krom "452": WebGL varsa gerçek zamanlı 3B sahne, yoksa (ya da
 * sahne hata verirse) aynı dış hatlardan çizilen 2B krom yedek.
 *
 * Sahne yalnızca istemcide yüklenir; yüklenene kadar alan siyah kalır
 * (intro zaten siyahtan başlıyor), ayrı bir yükleniyor ekranı yok.
 */
const Chrome452Scene = dynamic(() => import("./chrome-452-scene"), {
  ssr: false,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useReducedMotionPref() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** WebGL desteği tarayıcıda bir kez ölçülür; sunucuda "bilinmiyor". */
function useWebGL(): boolean | null {
  return useSyncExternalStore(
    () => () => {},
    supportsWebGL,
    () => null,
  );
}

export function Hero452() {
  const reduced = useReducedMotionPref();
  const webgl = useWebGL();
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  // Hero görünmüyorken 3B çizim durur.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setActive(entry.isIntersecting),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show3D = webgl === true && !failed;

  return (
    <div ref={box} aria-hidden className="absolute inset-0">
      {show3D ? (
        <SceneBoundary onError={() => setFailed(true)}>
          <div className="hero-452-canvas absolute inset-0">
            <Chrome452Scene
              reduced={reduced}
              active={active}
              onError={() => setFailed(true)}
            />
          </div>
        </SceneBoundary>
      ) : (
        webgl !== null && <Chrome452Fallback />
      )}
    </div>
  );
}

/** Sahne çalışırken hata verirse 2B yedeğe düşer. */
class SceneBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

/** Aynı dış hatlardan 2B krom "452" (WebGL yoksa). */
function Chrome452Fallback() {
  const xs = GLYPHS_452.flatMap((g) => g.outer.map((p) => p[0]));
  const ys = GLYPHS_452.flatMap((g) => g.outer.map((p) => p[1]));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const ring = (r: [number, number][]) =>
    "M" + r.map(([x, y]) => `${x},${-y}`).join("L") + "Z";
  const d = GLYPHS_452.map(
    (g) => ring(g.outer) + g.holes.map(ring).join(""),
  ).join("");

  return (
    <div className="hero-452-fallback absolute inset-0 grid place-items-center">
      <svg
        viewBox={`${minX - 6} ${-maxY - 6} ${maxX - minX + 12} ${maxY - minY + 12}`}
        className="w-[min(86vw,62%)] max-h-[50%] drop-shadow-[0_0_28px_rgb(150_195_255/0.28)]"
      >
        <defs>
          <linearGradient id="chrome-452" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.38" stopColor="#c9d6e6" />
            <stop offset="0.5" stopColor="#5d6f86" />
            <stop offset="0.62" stopColor="#e8f1ff" />
            <stop offset="1" stopColor="#8fb4e6" />
          </linearGradient>
        </defs>
        <path
          d={d}
          fill="url(#chrome-452)"
          fillRule="evenodd"
          stroke="#eaf3ff"
          strokeWidth={0.8}
          strokeOpacity={0.7}
        />
      </svg>
    </div>
  );
}
