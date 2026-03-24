import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_PROXY_PATH = "/api/proxy";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Proxy API calls to the backend
  if (pathname.startsWith(API_PROXY_PATH)) {
    const url = new URL(request.url);
    const newPath = url.pathname.replace(API_PROXY_PATH, "");
    const newUrl = process.env.BACKEND_HOST + newPath + url.search + url.hash;
    return NextResponse.rewrite(newUrl, { request });
  }

  // All other requests pass through (no auth check in ISB mode)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|health).*)"],
};
