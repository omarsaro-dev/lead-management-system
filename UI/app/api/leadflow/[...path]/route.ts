import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin, sessionCookie, validSession } from "@/lib/auth";

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (!validSession((await cookies()).get(sessionCookie)?.value)) return NextResponse.json({ detail: "Please sign in to continue." }, { status: 401 });
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) return NextResponse.json({ detail: "This request is not allowed." }, { status: 403 });
  const { path } = await context.params;
  if (!(path.length === 1 && ["health", "leads"].includes(path[0]) || path[0] === "leads" && (path.length === 2 || path.length === 3 && path[2] === "qualification"))) return NextResponse.json({ detail: "Not found." }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return NextResponse.json({ detail: "Your workspace is not ready yet." }, { status: 503 });
  try {
    const response = await fetch(`${base}/${path.map(encodeURIComponent).join("/")}`, {
      method: request.method,
      headers: { Accept: "application/json", "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(14000),
    });
    return new Response(response.status === 204 ? null : await response.text(), { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ detail: "Unable to load your workspace. Please try again." }, { status: 502 }); }
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
