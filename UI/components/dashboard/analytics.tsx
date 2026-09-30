"use client";

import { ChartNoAxesCombined, RefreshCw, Sparkles } from "lucide-react";
import { useDashboard } from "./provider";
import { Stats } from "./stats";
import { getStats, statuses, titleCase } from "@/lib/utils";

export function Analytics() {
  const { leads, loading, error, refresh, refreshing } = useDashboard();
  const stats = getStats(leads);
  const serviceNames = Array.from(new Set(leads.map(lead => lead.service)));
  const knownStatuses = Array.from(new Set([...statuses, ...leads.map(lead => lead.state.toLowerCase())]));
  const groups = [{ title: "Pipeline by status", subtitle: "Where your conversations stand", rows: knownStatuses.map(status => ({ label: titleCase(status), count: leads.filter(lead => lead.state.toLowerCase() === status).length })) }, { title: "Interest by service", subtitle: "What your leads are looking for", rows: serviceNames.map(service => ({ label: service || "Unspecified", count: leads.filter(lead => lead.service === service).length })).sort((a, b) => b.count - a.count) }];
  return <><div className="page-heading"><div><div className="eyebrow"><span className="heading-line" /> THE BIGGER PICTURE</div><h1>Pipeline insights<span className="heading-dot">.</span></h1><p>Real numbers. Clear direction. Find the opportunity in your pipeline.</p></div><button className="button" disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={16} className={refreshing ? "spin" : ""} />Refresh</button></div><Stats />{error && <div className="error-banner" role="alert">{error} {leads.length > 0 && "Showing previously loaded data."}</div>}<div className="analytics-grid">{groups.map(group => <section className="analytics-card" key={group.title}><div className="panel-heading"><div><h2>{group.title}</h2><p>{group.subtitle}</p></div><ChartNoAxesCombined size={20} /></div><div className="chart-rows">{loading ? <div className="skeleton chart-skeleton" /> : !leads.length ? <p className="muted">Insights will appear when leads are available.</p> : group.rows.map(row => <div className="chart-row" key={row.label}><div><span>{row.label}</span><strong>{row.count}<small>{Math.round(row.count / leads.length * 100)}%</small></strong></div><div className="chart-track"><div style={{ width: `${row.count / leads.length * 100}%` }} /></div></div>)}</div></section>)}</div><div className="insight-banner"><span className="insight-icon"><Sparkles size={21} /></span><div><strong>Qualification coverage</strong><p>{loading ? "Loading qualification data…" : `${stats.scored} of ${stats.total} leads have an AI score. Missing scores are excluded from the average.`}</p></div></div></>;
}
