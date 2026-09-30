import { APIError, type Lead, type LeadCreate, type LeadInput, type Qualification } from "./types";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";

function detailMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("detail" in body)) return;
  const detail = body.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(item => {
    if (typeof item !== "object" || !item) return "Invalid input";
    return `${Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "Input"}: ${item.msg ?? "Invalid value"}`;
  }).join("; ");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiUrl || apiUrl.includes("YOUR-NGROK-URL")) {
    throw new APIError("Your workspace is not ready yet. Please contact your workspace owner.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    // An authenticated server route forwards this to the configured service without exposing session cookies.
    const response = await fetch(`/api/leadflow${path}`, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json", "ngrok-skip-browser-warning": "true", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    if (response.status === 401) { window.location.replace("/login"); throw new APIError("Your session has expired. Please sign in again.", 401); }
    if (response.status === 204) return undefined as T;
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: "The request is invalid. Please check your input.",
        404: "This lead no longer exists. Refresh the list.",
        409: "A lead with this email already exists.",
        422: "Please check the form values.",
        500: "Something went wrong. Please try again.",
        502: "Unable to load your workspace.",
        503: "Your workspace is temporarily unavailable.",
      };
      const detail = detailMessage(body);
      throw new APIError(detail && !/api|https?:|webhook|\.env/i.test(detail) ? detail : messages[response.status] || `Request failed (${response.status}).`, response.status);
    }
    if (body === null) throw new APIError("Unable to read your workspace data. Please try again.");
    return body as T;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(controller.signal.aborted ? "This is taking longer than expected. Please try again." : "Unable to load your workspace.");
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeLead(raw: unknown): Lead {
  if (!raw || typeof raw !== "object") throw new APIError("Unable to read this lead.");
  const data = raw as Record<string, unknown>;
  if (typeof data.email !== "string" || typeof data.name !== "string") throw new APIError("This lead is missing a name or email.");
  const text = (key: string) => typeof data[key] === "string" ? data[key] as string : "";
  const priority = text("priority").toLowerCase();
  const score = data.score === null || data.score === undefined || data.score === "" ? null : Number(data.score);
  return {
    name: data.name, email: data.email, phone: text("phone"), service: text("service"),
    state: text("state") || text("status") || "unknown",
    score: score !== null && Number.isFinite(score) && score >= 0 && score <= 100 ? score : null,
    priority: priority === "high" || priority === "medium" || priority === "low" ? priority : null,
    ai_summary: text("ai_summary") || null, next_action: text("next_action") || null,
    created_at: text("created_at") || undefined, updated_at: text("updated_at") || undefined,
  };
}

const leadPath = (email: string) => `/leads/${encodeURIComponent(email)}`;
export async function getLeads(): Promise<Lead[]> {
  const data = await request<unknown>("/leads");
  if (!Array.isArray(data)) throw new APIError("Unable to read your lead list.");
  return data.map(normalizeLead);
}
export const getLead = async (email: string) => normalizeLead(await request(leadPath(email)));
export const createLead = async (data: LeadCreate) => normalizeLead(await request("/leads", { method: "POST", body: JSON.stringify(data) }));
export const updateLead = async (email: string, data: LeadInput) => normalizeLead(await request(leadPath(email), { method: "PUT", body: JSON.stringify(data) }));
export const deleteLead = (email: string) => request<void>(leadPath(email), { method: "DELETE" });
export const updateQualification = (email: string, data: Qualification) => request<Qualification>(`${leadPath(email)}/qualification`, { method: "PATCH", body: JSON.stringify(data) });
export async function checkHealth() {
  const health = await request<{ status?: string }>("/health");
  if (health.status !== "ok") throw new APIError("Your workspace is temporarily unavailable.");
  return health;
}
