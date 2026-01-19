import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
