import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhostGrid - Collaborative System Design Whiteboard",
  description: "Real-time collaborative whiteboard with AI-powered architecture generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-cyber-dark text-cyber-green font-mono min-h-screen">
        {children}
      </body>
    </html>
  );
}