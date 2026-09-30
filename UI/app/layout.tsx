import type { Metadata } from "next";
import { WorkspaceLayout } from "@/components/auth/workspace-layout";
import "./globals.css";

export const metadata: Metadata = { title: "LeadFlow · Lead Management", description: "Your leads, clearly connected. An AI-powered lead management workspace." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><WorkspaceLayout>{children}</WorkspaceLayout></body></html>;
}
