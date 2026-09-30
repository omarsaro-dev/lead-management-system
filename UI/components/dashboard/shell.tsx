"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Activity, ArrowUpRight, ChartNoAxesCombined, LayoutDashboard, RefreshCw, Search, Settings2, Sparkles, Users, Zap } from "lucide-react";
import { useDashboard } from "./provider";

const navigation = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }, { href: "/leads", label: "Leads", icon: Users }, { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined }, { href: "/settings", label: "Settings", icon: Settings2 }];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { search, setSearch, refresh, refreshing, connection, leads, loading } = useDashboard();
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !target.closest("input, textarea, select, [contenteditable], dialog")) {
        const input = searchInput.current;
        if (input && input.getClientRects().length) { event.preventDefault(); input.focus(); }
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><Zap size={22} fill="currentColor" /></span>LeadFlow<span className="brand-dot">.</span></Link>
      <div className="workspace"><span className="workspace-avatar">LF</span><div><strong>My workspace</strong><small>Lead management</small></div><span className="workspace-tag">PRO</span></div>
      <span className="eyebrow nav-label">WORKSPACE</span>
      <nav aria-label="Main navigation">{navigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`nav-link ${path === href ? "active" : ""}`} aria-current={path === href ? "page" : undefined}><Icon size={19} /><span>{label}</span>{label === "Leads" && !loading && <span className="nav-count">{leads.length}</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="ai-note"><Sparkles size={19} /><strong>Less busywork.<br />More possibilities.</strong><p>Turn conversations into your next opportunity.</p><Link href="/analytics">Explore your insights <ArrowUpRight size={15} /></Link></div><div className="system-label"><span className="small-dot" />AI Lead Management System</div><div className="sidebar-footer"><span className="user-avatar">ME</span><div><strong>Your workspace</strong><small>Let’s make connections.</small></div></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Lead Management</strong></div><div className="topbar-actions"><label className="search top-search"><Search size={17} /><input ref={searchInput} aria-label="Search leads" placeholder="Search anything…" value={search} onChange={event => setSearch(event.target.value)} /><kbd>/</kbd></label><span className={`connection ${connection}`}><span className="small-dot" />{connection === "checking" ? "Checking…" : connection === "connected" ? "Connected" : "Offline"}</span><button className="icon-button refresh-top" title="Refresh data" aria-label="Refresh data" disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={17} className={refreshing ? "spin" : ""} /></button><span className="top-avatar"><Activity size={17} /></span></div></header><main id="main">{children}</main><footer className="main-footer"><span>LeadFlow <span className="footer-separator">/</span> Every connection counts.</span><span><span className="small-dot" /> Your pipeline, in focus</span></footer></div>
  </div>;
}
