"use client";
import { usePathname } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/provider";
import { Shell } from "@/components/dashboard/shell";
export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/login") return children;
  return <DashboardProvider><Shell>{children}</Shell></DashboardProvider>;
}
