"use client";

import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { BACKDROP_HORIZON, BACKDROP_URL } from "./backdrop";
import { LOGO_452_PATHS, LOGO_452_VIEWBOX } from "./glyphs-452";
import { HERO_EXIT_EVENT } from "./intro-timing";

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

/**
 * Sonuç önbelleğe alınır: useSyncExternalStore bu fonksiyonu her render'da
 * çağırır ve her çağrı yeni bir WebGL bağlamı açarsa tarayıcı sınırı aşılır
 * ("Too many active WebGL contexts"), sahnenin gerçek bağlamı kaybolabilir.
 * Test bağlamı hemen serbest bırakılır.
 */
let webglSupport: boolean | undefined;

function supportsWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webglSupport = !!gl;
  } catch {
    webglSupport = false;
  }
  return webglSupport;
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

  // Çıkışta 2B yedek de söner (3B sahne olayı kendisi dinler).
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    const onExit = () => setExiting(true);
    window.addEventListener(HERO_EXIT_EVENT, onExit);
    return () => window.removeEventListener(HERO_EXIT_EVENT, onExit);
  }, []);

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
        webgl !== null && (
          <div
            className={`absolute inset-0 transition-opacity duration-[650ms] ${exiting ? "opacity-0" : ""}`}
          >
            <Chrome452Fallback />
          </div>
        )
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
  // Tek path + evenodd: "4"ün iç boşluğu delik olarak kalır.
  const d = LOGO_452_PATHS.join(" ");

  return (
    <div
      className="hero-452-fallback absolute inset-0 grid place-items-center bg-cover"
      style={{
        backgroundImage: `url(${BACKDROP_URL})`,
        backgroundPosition: `50% ${BACKDROP_HORIZON * 100}%`,
      }}
    >
      <svg
        viewBox={`0 0 ${LOGO_452_VIEWBOX.width} ${LOGO_452_VIEWBOX.height}`}
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
