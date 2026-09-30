"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return <div><button className="button" disabled={busy} onClick={async () => {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error();
      window.location.replace("/login");
    } catch { setError(true); setBusy(false); }
  }}><LogOut size={16} />{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="muted">Could not sign out. Please try again.</p>}</div>;
}
