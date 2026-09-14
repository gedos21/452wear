"use client";

import { useEffect, useState } from "react";

/**
 * Sunucuda ve dokunmatik cihazlarda false döner; yalnızca gerçek bir imleç
 * varsa true olur. İlk render her zaman false olduğu için hydration uyuşur,
 * mouse'lu cihazlarda efekt mount sonrası devreye girer.
 */
export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);

    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return fine;
}
