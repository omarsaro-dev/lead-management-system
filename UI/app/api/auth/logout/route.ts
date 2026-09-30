import { NextResponse } from "next/server";
import { sameOrigin, sessionCookie } from "@/lib/auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "This request is not allowed." }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookie, "", { httpOnly: true, sameSite: "strict", secure: new URL(request.headers.get("origin")!).protocol === "https:", path: "/", maxAge: 0 });
  return response;
}
