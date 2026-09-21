import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED = ["ar", "en"];
const DEFAULT_LOCALE = "ar";

/**
 * Locale guard (Next.js 16 proxy convention) — every public path must live under a supported locale.
 * Invalid or missing locale prefixes redirect to the default locale,
 * preserving the rest of the path so deep links survive.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal assets and API routes.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && SUPPORTED.includes(first)) {
    return NextResponse.next();
  }

  const rest = segments.length ? `/${segments.join("/")}` : "";
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${rest === "/" ? "" : rest}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
