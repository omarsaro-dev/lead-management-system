import { APIError, type LeadCreate, type LeadPriority } from "./types";

export interface WorkflowResult {
  success: true;
  email: string;
  score: number;
  priority: LeadPriority;
}

export async function submitLeadToWorkflow(data: LeadCreate): Promise<WorkflowResult> {
  try {
    const response = await fetch("/api/n8n/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(115_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) {
      throw new APIError(result?.message || "The workflow did not confirm completion. Refresh and check the lead before submitting again.", response.status);
    }
    return result as WorkflowResult;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError("Connection lost while processing your lead. The workflow may still finish. Refresh and check the lead before submitting again.");
  }
}
