import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ClinicProvider } from "@/lib/ClinicContext";

export const metadata: Metadata = {
  title: "PhysioCare – Manajemen Klinik",
  description: "Kelola klinik fisioterapi Anda dengan mudah",
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
    <html lang="id">
      <body>
        <ClinicProvider>
          <AppShell>{children}</AppShell>
        </ClinicProvider>
      </body>
    </html>
  );
}
