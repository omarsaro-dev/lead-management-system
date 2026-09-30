"use client";

import Link from "next/link";
import { ArrowRight, CircleDot, FilterX, Layers3 } from "lucide-react";
import { useDashboard } from "./provider";
import { services, statuses, titleCase } from "@/lib/utils";

const nodes = [
  { key: "new", label: "New", x: 116, y: 100, color: "#73d8c3" },
  { key: "contacted", label: "Contacted", x: 280, y: 64, color: "#83bdb4" },
  { key: "qualified", label: "Qualified", x: 520, y: 72, color: "#9bd59e" },
  { key: "converted", label: "Converted", x: 650, y: 194, color: "#b6d58b" },
  { key: "lost", label: "Lost", x: 514, y: 298, color: "#d7a678" },
  { key: "__other__", label: "Other", x: 245, y: 292, color: "#8fa9a3" },
];

export function LeadLandscape() {
  const { leads, statusFilter, serviceFilter, setStatusFilter, setServiceFilter, loading, error } = useDashboard();
  const knownStates = new Set(statuses);
  const hasOtherStates = leads.some(lead => !knownStates.has(lead.state.toLowerCase() as typeof statuses[number]));
  const visibleNodes = hasOtherStates ? nodes : nodes.filter(node => node.key !== "__other__");
  const countFor = (key: string) => key === "__other__"
    ? leads.filter(lead => !knownStates.has(lead.state.toLowerCase() as typeof statuses[number])).length
    : leads.filter(lead => lead.state.toLowerCase() === key).length;
  const filteredLeads = leads.filter(lead => {
    const stateMatch = !statusFilter || (statusFilter === "__other__" ? !knownStates.has(lead.state.toLowerCase() as typeof statuses[number]) : lead.state.toLowerCase() === statusFilter);
    const serviceMatch = !serviceFilter || lead.service.toLowerCase() === serviceFilter.toLowerCase();
    return stateMatch && serviceMatch;
  });
  const focusLabel = statusFilter === "__other__" ? "Other statuses" : statusFilter ? titleCase(statusFilter) : "All leads";
  const denominator = filteredLeads.length || 1;
  const serviceOptions = Array.from(new Set([...services, ...leads.map(lead => lead.service).filter(Boolean)]));
  const serviceCounts = serviceOptions.map(service => ({
    name: service,
    count: filteredLeads.filter(lead => lead.service.toLowerCase() === service.toLowerCase()).length,
  }));
  const toggleStatus = (key: string) => {
    setStatusFilter(statusFilter === key ? "" : key);
    if (statusFilter !== key) setServiceFilter("");
  };
  const toggleService = (service: string) => setServiceFilter(serviceFilter.toLowerCase() === service.toLowerCase() ? "" : service);

  return <section className="lead-landscape" aria-labelledby="landscape-title">
    <div className="landscape-main">
      <div className="landscape-header">
        <div>
          <div className="landscape-kicker"><span className="live-pulse" /> LIVE WORKSPACE DATA</div>
          <h2 id="landscape-title">Pipeline landscape</h2>
          <p>Explore your leads by current status. Select a node to filter the list.</p>
        </div>
        <div className="landscape-header-actions">
          <span className="landscape-record-count"><CircleDot size={13} /> {leads.length} {leads.length === 1 ? "lead" : "leads"}</span>
          {(statusFilter || serviceFilter) && <button className="landscape-clear" onClick={() => { setStatusFilter(""); setServiceFilter(""); }}><FilterX size={14} /> Clear</button>}
        </div>
      </div>
      <div className="landscape-graph-wrap">
        {error && !leads.length ? <div className="landscape-empty"><CircleDot size={23} /><strong>Workspace data unavailable</strong><span>Reconnect or refresh to load the live pipeline.</span></div> : <>
          <svg className={`landscape-graph${loading ? " is-loading" : ""}`} viewBox="0 0 760 360" role="img" aria-label={`Interactive map of ${leads.length} leads grouped by status`}>
            <defs>
              <pattern id="landscape-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#77948d" strokeOpacity=".08" strokeWidth=".65" /></pattern>
              <radialGradient id="landscape-core"><stop offset="0%" stopColor="#53d8c2" stopOpacity=".22" /><stop offset="100%" stopColor="#53d8c2" stopOpacity="0" /></radialGradient>
              <filter id="node-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect width="760" height="360" fill="url(#landscape-grid)" />
            <circle cx="380" cy="180" r="145" fill="url(#landscape-core)" />
            {visibleNodes.map(node => {
              const active = statusFilter === node.key;
              const dimmed = Boolean(statusFilter && !active);
              return <path key={`edge-${node.key}`} className={`graph-edge${active ? " active" : ""}${dimmed ? " dimmed" : ""}`} d={`M 380 180 Q ${(380 + node.x) / 2} ${(180 + node.y) / 2 - 12} ${node.x} ${node.y}`} stroke={node.color} />;
            })}
            <circle className="graph-core-halo" cx="380" cy="180" r="83" />
            <circle className="graph-core" cx="380" cy="180" r="47" />
            <text className="graph-core-value" x="380" y="178">{loading ? "···" : leads.length}</text>
            <text className="graph-core-label" x="380" y="201">ALL LEADS</text>
            {visibleNodes.map(node => {
              const active = statusFilter === node.key;
              const dimmed = Boolean(statusFilter && !active);
              const count = countFor(node.key);
              const radius = 19 + Math.min(Math.sqrt(count) * 3.8, 12);
              const placeBeside = node.x > 600;
              const below = node.y < 120 || node.y > 260;
              const labelX = placeBeside ? node.x - radius - 8 : node.x;
              const labelY = below ? node.y + radius + 25 : node.y + 7;
              return <g key={node.key} className={`graph-node${active ? " active" : ""}${dimmed ? " dimmed" : ""}`} role="button" tabIndex={0} aria-label={`Filter by ${node.label}: ${count} leads`} aria-pressed={active} onClick={() => toggleStatus(node.key)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleStatus(node.key); } }}>
                <title>{node.label}: {count} {count === 1 ? "lead" : "leads"}</title>
                <circle className="graph-node-glow" cx={node.x} cy={node.y} r={radius + 12} fill={node.color} />
                <circle className="graph-node-ring" cx={node.x} cy={node.y} r={radius + 5} stroke={node.color} />
                <circle className="graph-node-core" cx={node.x} cy={node.y} r={radius} stroke={node.color} />
                <text className="graph-node-count" x={node.x} y={node.y + 6}>{count > 99 ? "99+" : count}</text>
                <text className="graph-node-label" x={labelX} y={labelY} textAnchor={placeBeside ? "end" : "middle"}>{node.label.toUpperCase()}</text>
              </g>;
            })}
          </svg>
          {!loading && leads.length === 0 && <div className="landscape-empty-overlay"><span>NO LEADS YET</span><small>Add a lead to populate your live pipeline.</small></div>}
        </>}
      </div>
      <div className="landscape-legend"><span><i className="legend-dot teal" /> Status groups</span><span><i className="legend-line" /> Count of live records</span><span className="landscape-footnote">No lead-to-lead relationships implied</span></div>
    </div>
    <aside className="landscape-inspector" aria-label="Pipeline selection details">
      <div className="inspector-heading"><span className="inspector-icon"><Layers3 size={16} /></span><div><span>FOCUS</span><h3>{focusLabel}</h3></div></div>
      <div className="inspector-total"><strong>{loading ? "—" : filteredLeads.length}</strong><span>matching {filteredLeads.length === 1 ? "lead" : "leads"}</span></div>
      <p className="inspector-copy">{statusFilter ? `${focusLabel} records in your workspace.` : serviceFilter ? `Filtered to ${serviceFilter}.` : "A live view of your current workspace records."}</p>
      <div className="inspector-divider" />
      <div className="inspector-section-title">SERVICE MIX <span>COUNT</span></div>
      <div className="service-mix-list">{serviceCounts.map(item => <button type="button" className={`service-mix-row${serviceFilter.toLowerCase() === item.name.toLowerCase() ? " selected" : ""}`} key={item.name} onClick={() => toggleService(item.name)} aria-pressed={serviceFilter.toLowerCase() === item.name.toLowerCase()}>
        <span className="service-mix-name"><i />{item.name}</span><span className="service-mix-count">{loading ? "—" : item.count}</span>
        <span className="service-mix-track"><i style={{ width: `${filteredLeads.length ? item.count / denominator * 100 : 0}%` }} /></span>
      </button>)}</div>
      <Link className="landscape-link" href="/leads">View filtered leads <ArrowRight size={15} /></Link>
    </aside>
  </section>;
}
