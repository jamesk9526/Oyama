import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { WindowControls } from "@/components/layout/WindowControls";

export const metadata: Metadata = {
  title: "Oyama - AI Agent Collaboration Platform",
  description: "Build, customize, and orchestrate AI agents with multi-agent workflows",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* Title bar for Electron (draggable area) */}
        <div className="h-8 bg-background border-b border-border flex items-center justify-between px-4 select-none"
             style={{ WebkitAppRegion: 'drag' } as any}>
          <span className="text-xs text-muted-foreground">Oyama</span>
          <WindowControls />
        </div>

        <div className="flex h-[calc(100vh-2rem)] overflow-hidden relative">
          <Sidebar />
          <main className="flex-1 overflow-hidden w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
