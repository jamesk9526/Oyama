import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { WindowControls } from "@/components/layout/WindowControls";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Oyama - AI Agent Collaboration Platform",
  description: "Build, customize, and orchestrate AI agents with multi-agent workflows, advanced prompt engineering, and a modern interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A0F" />
      </head>
      <body>
        {/* Skip Link for Accessibility */}
        <a 
          href="#main-content" 
          className="skip-link"
        >
          Skip to main content
        </a>
        
        <ToastProvider>
          {/* Title bar for Electron (draggable area) */}
          <div 
            className="h-8 bg-background border-b border-border flex items-center justify-between px-4 select-none glass"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            role="banner"
          >
            <span className="text-xs text-muted-foreground font-medium">Oyama</span>
            <WindowControls />
          </div>

          <div className="flex h-[calc(100vh-2rem)] overflow-hidden relative">
            <Sidebar />
            <main 
              id="main-content" 
              className="flex-1 overflow-hidden w-full"
              role="main"
              tabIndex={-1}
            >
              <ClientLayout>
                {children}
              </ClientLayout>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
