"use client";

import { useState } from "react";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Stats } from "./stats";
import { LeadLandscape } from "./lead-landscape";
import { useDashboard } from "./provider";
import { LeadList } from "@/components/leads/lead-list";
import { LeadDialog, type LeadDialogState } from "@/components/leads/lead-dialog";

export function Dashboard({ leadsOnly = false }: { leadsOnly?: boolean }) {
  const { lastUpdated } = useDashboard();
  const [dialog, setDialog] = useState<LeadDialogState | null>(null);
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="heading-line" /> YOUR PIPELINE, AT A GLANCE</div><h1>{leadsOnly ? "Your leads" : "Lead Management"}<span className="heading-dot">.</span></h1><p>A little clarity. A lot of opportunity. Keep every lead moving forward.</p></div><button className="button primary" onClick={() => setDialog({ mode: "create" })}><Plus size={17} /> Add lead</button></div>
    <Stats />
    {!leadsOnly && <LeadLandscape />}
    {!leadsOnly && <div className="insight-banner"><span className="insight-icon"><Sparkles size={21} /></span><div><strong>Meet your next best opportunity.</strong><p>AI qualification helps you focus on the leads that matter. Start with high-priority leads.</p></div><Link href="/analytics">View insights <ArrowUpRight size={16} /></Link></div>}
    <LeadList onAction={setDialog} />
    <div className="data-note"><span className="small-dot" />Live workspace data<span>·</span>{lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for first sync"}<span className="data-note-right">Built for better connections.</span></div>
    {dialog && <LeadDialog key={`${dialog.mode}-${dialog.mode === "create" ? "new" : dialog.lead.email}`} dialog={dialog} onClose={() => setDialog(null)} onChange={setDialog} />}
  </>;
}
