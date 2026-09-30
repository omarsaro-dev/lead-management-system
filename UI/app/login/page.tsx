"use client";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Sparkles, Zap } from "lucide-react";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to sign in. Please try again.");
      window.location.replace("/");
    } catch (reason) { setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Sign-in took too long. Please try again."); setBusy(false); }
  }
  return <div className="login-page"><section className="login-story"><div className="brand"><span className="brand-mark"><Zap size={22} fill="currentColor" /></span>LeadFlow<span className="brand-dot">.</span></div><div className="login-story-content"><span className="login-tag"><Sparkles size={15} /> A little clarity. A lot of opportunity.</span><h1>Great relationships<br />start with a<br /><span>clearer view.</span></h1><p>Your leads, conversations, and next opportunities.<br />One thoughtful workspace to keep it all moving.</p><div className="login-illustration" aria-hidden="true"><div className="login-orbit"><Zap size={38} /></div><span className="orbit-label label-one"><Check size={14} />Stay connected</span><span className="orbit-label label-two"><Sparkles size={14} />Find your next opportunity</span></div></div><small>Every connection counts.</small></section><section className="login-form-section"><div className="login-form-wrap"><span className="login-lock"><LockKeyhole size={23} /></span><div className="eyebrow">YOUR WORKSPACE AWAITS</div><h2>Welcome back<span className="heading-dot">.</span></h2><p>Sign in to pick up where you left off.</p><form onSubmit={submit}><label htmlFor="email">Email address</label><div className="login-input"><Mail size={17} /><input id="email" name="email" type="email" autoComplete="username" placeholder="you@company.com" required maxLength={254} disabled={busy} value={email} onChange={event => setEmail(event.target.value)} /></div><label htmlFor="password">Password</label><div className="login-input"><LockKeyhole size={17} /><input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required maxLength={1024} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" className="icon-button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{error && <div role="alert" className="login-error">{error}</div>}<button className="button primary login-submit" type="submit" disabled={busy}>{busy && <LoaderCircle size={18} className="spin" />}{busy ? "Signing in…" : "Sign in to your workspace"}{!busy && <ArrowRight size={17} />}</button></form><p className="login-help">Need access or forgot your password?<br />Contact your workspace owner.</p><div className="login-security"><LockKeyhole size={12} />Your session stays private.</div></div></section></div>;
}
