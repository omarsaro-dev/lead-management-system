import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionCookie, validSession } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

const uncertain = "The workflow did not confirm completion. The lead may already be saved. Refresh and check its email before submitting again.";

// Transport adapter only: the existing n8n workflow owns creation and qualification.
export async function POST(request: Request) {
  if (!validSession((await cookies()).get(sessionCookie)?.value)) return NextResponse.json({ message: "Please sign in to continue." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const source = new URL(origin);
      // Next.js may use an internal hostname in request.url; compare the browser-facing Host.
      const host = request.headers.get("host") ?? new URL(request.url).host;
      if (!["http:", "https:"].includes(source.protocol) || source.host !== host) throw new Error("Origin mismatch");
    } catch {
      return NextResponse.json({ message: "Cross-origin submissions are not allowed." }, { status: 403 });
    }
  }
  const webhook = process.env.N8N_WEBHOOK_URL?.trim();
  if (!webhook) return NextResponse.json({ message: "Lead creation is not ready yet. Contact your workspace owner." }, { status: 503 });
  let url: URL;
  try {
    url = new URL(webhook);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid URL");
  } catch {
    return NextResponse.json({ message: "Lead creation is not ready yet. Contact your workspace owner." }, { status: 503 });
  }
  let data: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body");
    data = body as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Send a JSON lead object." }, { status: 400 });
  }
  const value = (field: string) => typeof data[field] === "string" ? data[field].trim() : "";
  const lead = { name: value("name"), email: value("email").toLowerCase(), phone: value("phone"), service: value("service"), state: value("state") || "new" };
  if (!lead.name || lead.name.length > 200 || lead.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !/^\d{11}$/.test(lead.phone) || !["ai automation", "ai chatbot", "web development"].includes(lead.service.toLowerCase()) || lead.state.length > 100) {
    return NextResponse.json({ message: "Enter a name, valid email, 11-digit phone, supported service, and status." }, { status: 422 });
  }
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(110_000),
      cache: "no-store",
      redirect: "error",
    });
    const result: unknown = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const message = upstream.status === 404 ? "Lead creation is temporarily unavailable. Contact your workspace owner." : upstream.status === 409 ? "A lead with this email already exists. Check the lead list." : uncertain;
      return NextResponse.json({ message }, { status: upstream.status === 404 || upstream.status === 409 ? upstream.status : 502 });
    }
    if (!result || typeof result !== "object" || !("success" in result)) {
      return NextResponse.json({ message: uncertain }, { status: 502 });
    }
    const response = result as Record<string, unknown>;
    // The workflow's invalid-data branch returns HTTP 200 with success:false.
    if (response.success === false) return NextResponse.json({ message: "Please check the required lead details." }, { status: 422 });
    if (response.success !== true || response.email !== lead.email || typeof response.score !== "number" || !Number.isFinite(response.score) || response.score < 0 || response.score > 100 || !["high", "medium", "low"].includes(String(response.priority))) {
      return NextResponse.json({ message: uncertain }, { status: 502 });
    }
    return NextResponse.json({ success: true, email: response.email, score: response.score, priority: response.priority }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: uncertain }, { status: 504 });
  }
}
