"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Mail, Pencil, Phone, Sparkles, Trash2 } from "lucide-react";
import { deleteLead, getLead, updateLead } from "@/lib/api";
import { submitLeadToWorkflow } from "@/lib/n8n";
import type { Lead, LeadInput } from "@/lib/types";
import { initials, services, statuses, titleCase } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/provider";
import { Modal } from "@/components/ui/modal";
import { PriorityBadge, Score, StatusBadge } from "@/components/ui/lead-badges";

export type LeadDialogState = { mode: "create" } | { mode: "view" | "edit" | "status" | "delete"; lead: Lead };
export function LeadDialog({ dialog, onClose, onChange }: { dialog: LeadDialogState; onClose: () => void; onChange: (state: LeadDialogState) => void }) {
  const original = dialog.mode === "create" ? null : dialog.lead;
  const [lead, setLead] = useState(original);
  const [fetching, setFetching] = useState(dialog.mode === "view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: original?.name ?? "", email: original?.email ?? "", phone: original?.phone ?? "", service: original?.service ?? services[0], state: original?.state ?? "new" });
  const { notify, refresh, setLeads, refreshing } = useDashboard();
  useEffect(() => {
    if (dialog.mode !== "view") return;
    let active = true;
    getLead(dialog.lead.email).then(value => { if (active) setLead(value); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load lead details."); }).finally(() => { if (active) setFetching(false); });
    return () => { active = false; };
  }, [dialog]);
  const titles = { create: "Add a new lead", view: "Lead details", edit: "Edit lead", status: "Change status", delete: "Delete lead" };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || refreshing) return;
    setBusy(true); setError("");
    try {
      if (dialog.mode === "delete" && lead) {
        await deleteLead(lead.email);
        setLeads(current => current.filter(item => item.email !== lead.email));
        notify("Lead deleted");
      } else {
        const payload: LeadInput = { name: form.name.trim(), phone: form.phone.trim(), service: form.service, state: form.state };
        if (dialog.mode === "create") {
          const result = await submitLeadToWorkflow({ ...payload, email: form.email.trim().toLowerCase() });
          notify(`Lead created and qualified · Score ${result.score}/100 · ${titleCase(result.priority)} priority`);
        } else {
          const result = await updateLead(lead!.email, payload);
          setLeads(current => current.map(item => item.email === result.email ? result : item));
          notify("Lead updated");
        }
      }
      await refresh();
      onClose();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The request failed. Please try again.";
      setError(message); notify(message, "error");
      // n8n creates the lead before AI/email steps; a later failure can leave a saved lead.
      if (dialog.mode === "create") await refresh();
    } finally { setBusy(false); }
  }
  const field = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  return <Modal title={titles[dialog.mode]} onClose={onClose} busy={busy} wide={dialog.mode === "view"}>
    {error && <div className="form-error" role="alert">{error}</div>}
    {dialog.mode === "view" && lead ? <div className="details"><div className="detail-profile"><span className="lead-avatar large">{initials(lead.name)}</span><div><h3>{lead.name}</h3><p>{lead.service}</p></div><StatusBadge state={lead.state} /></div><div className="detail-contact"><a href={`mailto:${lead.email}`}><Mail size={16} />{lead.email}</a><a href={`tel:${lead.phone}`}><Phone size={16} />{lead.phone || "No phone provided"}</a></div>
      <section className="qualification"><h3><Sparkles size={18} />AI qualification{fetching && <LoaderCircle size={16} className="spin" />}</h3><div className="qualification-metrics"><div><label>AI SCORE</label><Score score={lead.score} /></div><div><label>PRIORITY</label><PriorityBadge priority={lead.priority} /></div></div><label>AI SUMMARY</label><p>{lead.ai_summary || "No AI summary available yet."}</p><div className="next-action"><ArrowRight size={17} /><div><label>NEXT ACTION</label><p>{lead.next_action || "No next action available yet."}</p></div></div></section>
      {(lead.created_at || lead.updated_at) && <div className="timestamps">{lead.created_at && <p>Created: {lead.created_at}</p>}{lead.updated_at && <p>Updated: {lead.updated_at}</p>}</div>}
      <div className="modal-actions wrap"><button className="button danger" onClick={() => onChange({ mode: "delete", lead })}><Trash2 size={16} />Delete lead</button><button className="button" onClick={() => onChange({ mode: "status", lead })}>Change status</button><button className="button primary" onClick={() => onChange({ mode: "edit", lead })}><Pencil size={15} />Edit lead</button></div>
    </div> : <form onSubmit={submit} className="lead-form">
      {dialog.mode === "create" && <p className="workflow-note" role="status">{busy ? "Creating and qualifying your lead. Please wait; this can take up to two minutes." : "Creates your lead, runs AI qualification, and sends an email notification."}</p>}
      {dialog.mode === "delete" ? <div className="delete-copy"><span className="delete-symbol"><Trash2 size={26} /></span><h3>Are you sure you want to delete this lead?</h3><p><strong>{lead?.name}</strong> ({lead?.email}) will be permanently removed. This action cannot be undone.</p></div> : <>
        {dialog.mode !== "status" && <><label>Name<input required autoComplete="name" maxLength={200} value={form.name} onChange={event => field("name", event.target.value)} /></label>{dialog.mode === "create" && <label>Email<input required type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => field("email", event.target.value)} /></label>}<label>Phone<input required type="tel" inputMode="numeric" autoComplete="tel" pattern="[0-9]{11}" title="Enter exactly 11 digits" value={form.phone} onChange={event => field("phone", event.target.value)} /><small>Enter exactly 11 digits.</small></label><label>Service<select value={form.service} onChange={event => field("service", event.target.value)}>{Array.from(new Set([...services, form.service])).map(service => <option key={service}>{service}</option>)}</select></label></>}
        <label>Status<select value={form.state} onChange={event => field("state", event.target.value)}>{Array.from(new Set([...statuses, form.state])).map(state => <option key={state} value={state}>{titleCase(state)}</option>)}</select></label>
      </>}
      <div className="modal-actions"><button type="button" className="button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={`button ${dialog.mode === "delete" ? "danger solid" : "primary"}`} disabled={busy || refreshing}>{busy && <LoaderCircle size={16} className="spin" />}{busy ? (dialog.mode === "create" ? "Qualifying…" : "Saving…") : dialog.mode === "delete" ? "Delete lead" : dialog.mode === "create" ? "Create & qualify" : "Save changes"}</button></div>
    </form>}
  </Modal>;
}
