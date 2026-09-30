import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, validSession, sameOrigin } from "@/lib/auth";
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const signedIn = validSession(request.cookies.get(sessionCookie)?.value);
  if (path === "/login") return signedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  if (path === "/api/auth/login") return NextResponse.next();
  if (!signedIn) {
    if (path.startsWith("/api/")) return NextResponse.json({ message: "Please sign in to continue.", detail: "Please sign in to continue." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !sameOrigin(request)) return NextResponse.json({ message: "This request is not allowed." }, { status: 403 });
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
