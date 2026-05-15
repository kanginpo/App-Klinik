import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/SidebarWrapper";
import { ClinicProvider } from "@/lib/ClinicContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PhysioCare - Clinic Management",
  description: "Kelola klinik fisioterapi Anda dengan mudah",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PhysioCare",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50`}>
        <ClinicProvider>
          <div className="flex min-h-screen">
            <SidebarWrapper />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </ClinicProvider>
      </body>
    </html>
  );
}
