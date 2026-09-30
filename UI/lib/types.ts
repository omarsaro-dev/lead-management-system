export type LeadPriority = "high" | "medium" | "low";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export interface Lead {
  name: string;
  email: string;
  phone: string;
  service: string;
  state: string;
  score: number | null;
  priority: LeadPriority | null;
  ai_summary: string | null;
  next_action: string | null;
  created_at?: string;
  updated_at?: string;
}
export type LeadInput = Pick<Lead, "name" | "phone" | "service" | "state">;
export type LeadCreate = LeadInput & { email: string };
export interface Qualification {
  score: number;
  priority: LeadPriority;
  ai_summary: string;
  next_action: string;
}
export class APIError extends Error {
  constructor(message: string, public status: number = 0) {
    super(message);
    this.name = "APIError";
  }
}
