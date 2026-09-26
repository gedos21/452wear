"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EXIT_TOTAL, HERO_EXIT_EVENT } from "./intro-timing";

/**
 * Hero'nun alışveriş bağlantısı. Normal tıklamada önce 452 ve arka plan
 * söner (HERO_EXIT_EVENT), ardından aynı adrese gidilir. Yeni sekmede
 * açma (Ctrl/Cmd/orta tık) ve önceden yükleme olduğu gibi çalışır.
 */
export function HeroCta({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const leaving = useRef(false);

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
          return;
        e.preventDefault();
        if (leaving.current) return;
        leaving.current = true;
        window.dispatchEvent(new Event(HERO_EXIT_EVENT));
        window.setTimeout(() => router.push(href), EXIT_TOTAL * 1000);
      }}
    >
      {children}
    </Link>
  );
}
