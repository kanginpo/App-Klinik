import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ClinicProvider } from "@/lib/ClinicContext";

export const metadata: Metadata = {
  title: "PhysioCare – Clinic Management",
  description: "Manage your physiotherapy clinic with ease",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClinicProvider>
          <AppShell>{children}</AppShell>
        </ClinicProvider>
      </body>
    </html>
  );
}
