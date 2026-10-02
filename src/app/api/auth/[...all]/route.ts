import { getAuth } from "@/lib/server/auth";

/** Better Auth uç noktaları: /api/auth/* (giriş, kayıt, Google dönüşü…). */

function handle(request: Request) {
  return getAuth().handler(request);
}

export { handle as GET, handle as POST };
