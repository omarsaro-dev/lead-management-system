import { NextResponse } from "next/server";
import { authConfigured, createSession, sameOrigin, sessionCookie, sessionSeconds, validCredentials } from "@/lib/auth";
// Single-workspace, single-process throttle; use a shared limiter when scaling to multiple instances.
let attempts = 0;
let windowEnds = 0;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "This request is not allowed." }, { status: 403 });
  if (!authConfigured()) return NextResponse.json({ message: "Sign-in is not set up yet. Ask your workspace owner to complete account setup." }, { status: 503 });
  if (Date.now() > windowEnds) { attempts = 0; windowEnds = Date.now() + 15 * 60_000; }
  if (attempts >= 10) return NextResponse.json({ message: "Too many attempts. Please try again in 15 minutes." }, { status: 429, headers: { "Retry-After": String(Math.ceil((windowEnds - Date.now()) / 1000)) } });
  attempts++;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Enter your email and password." }, { status: 400 }); }
  if (!body || typeof body.email !== "string" || typeof body.password !== "string" || body.email.length > 254 || !(await validCredentials(body.email, body.password))) return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
  attempts = 0;
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(sessionCookie, createSession(), { httpOnly: true, sameSite: "strict", secure: new URL(request.headers.get("origin")!).protocol === "https:", path: "/", maxAge: sessionSeconds });
  return response;
}
