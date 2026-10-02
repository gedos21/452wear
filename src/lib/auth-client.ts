"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@/lib/server/auth";

/** Tarayıcı tarafı Better Auth istemcisi; aynı origin'deki /api/auth'a gider. */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>()],
});
