"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { checkHealth, getLeads } from "@/lib/api";
import type { Lead } from "@/lib/types";

type Connection = "checking" | "connected" | "offline";
type Toast = { id: number; message: string; kind: "success" | "error" };
interface DashboardContext {
  leads: Lead[]; loading: boolean; refreshing: boolean; error: string | null;
  connection: Connection; lastUpdated: Date | null; search: string;
  setSearch: (value: string) => void;
  refresh: () => Promise<void>;
  notify: (message: string, kind?: Toast["kind"]) => void;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}
const Context = createContext<DashboardContext | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>("checking");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const previous = useRef<Connection>("checking");
  const inFlight = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(0);
  const notify = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = ++nextId.current;
    setToasts(current => [...current.slice(-3), { id, message, kind }]);
    timers.current.push(setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 6000));
  }, []);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    setConnection("checking");
    const [health, result] = await Promise.allSettled([checkHealth(), getLeads()]);
    if (result.status === "fulfilled") {
      setLeads(result.value);
      setLastUpdated(new Date());
      setError(null);
    } else {
      const message = result.reason instanceof Error ? result.reason.message : "Unable to load leads.";
      setError(message);
      notify(message, "error");
    }
    const next = health.status === "fulfilled" && result.status === "fulfilled" ? "connected" : "offline";
    if (next === "connected" && previous.current === "offline") notify("Connection restored");
    setConnection(next);
    previous.current = next;
    setLoading(false);
    setRefreshing(false);
    inFlight.current = false;
  }, [notify]);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const online = () => void refresh();
    window.addEventListener("online", online);
    const toastTimers = timers.current;
    return () => { clearTimeout(initial); toastTimers.forEach(clearTimeout); window.removeEventListener("online", online); };
  }, [refresh]);
  return <Context.Provider value={{ leads, setLeads, loading, refreshing, error, connection, lastUpdated, search, setSearch, refresh, notify }}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-atomic="false">{toasts.map(toast => <div key={toast.id} className={`toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
      {toast.kind === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}<span>{toast.message}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}><X size={16} /></button>
    </div>)}</div>
  </Context.Provider>;
}
export function useDashboard() {
  const context = useContext(Context);
  if (!context) throw new Error("DashboardProvider is required");
  return context;
}
