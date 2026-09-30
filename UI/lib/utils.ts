import type { Lead } from "./types";

export const statuses = ["new", "contacted", "qualified", "converted", "lost"] as const;
export const services = ["AI Automation", "AI Chatbot", "Web Development"];
export const titleCase = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
export function getStats(leads: Lead[]) {
  const scored = leads.filter(lead => lead.score !== null);
  return {
    total: leads.length,
    high: leads.filter(lead => lead.priority === "high").length,
    medium: leads.filter(lead => lead.priority === "medium").length,
    low: leads.filter(lead => lead.priority === "low").length,
    average: scored.length ? Math.round(scored.reduce((sum, lead) => sum + lead.score!, 0) / scored.length) : null,
    scored: scored.length,
  };
}
