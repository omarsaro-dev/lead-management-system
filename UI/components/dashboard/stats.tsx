"use client";

import { ArrowUpRight, ChartNoAxesCombined, Flame, Layers, Users, Waves } from "lucide-react";
import { getStats } from "@/lib/utils";
import { useDashboard } from "./provider";

export function Stats() {
  const { leads, loading, error } = useDashboard();
  const stats = getStats(leads);
  const items = [
    { label: "Total leads", value: stats.total, caption: "Across your workspace", icon: Users, color: "violet" },
    { label: "High priority", value: stats.high, caption: "Ready for your attention", icon: Flame, color: "rose" },
    { label: "Medium priority", value: stats.medium, caption: "Keep the conversation going", icon: Layers, color: "amber" },
    { label: "Low priority", value: stats.low, caption: "Nurture for the future", icon: Waves, color: "blue" },
    { label: "Average AI score", value: stats.average ?? "—", caption: stats.scored ? `From ${stats.scored} scored leads` : "Awaiting qualification data", icon: ChartNoAxesCombined, color: "green" },
  ];
  return <div className="stats-grid">{items.map(({ label, value, caption, icon: Icon, color }) => <article className="stat-card" key={label}><div className="stat-heading"><span>{label}</span><Icon size={17} className={`text-${color}`} /></div>{loading ? <div className="skeleton stat-skeleton" /> : <div className="stat-value">{error && !leads.length ? "—" : value}{label === "Average AI score" && stats.average !== null && <small>/100</small>}<span className={`stat-accent ${color}`}><ArrowUpRight size={19} /></span></div>}<p>{caption}</p></article>)}</div>;
}
