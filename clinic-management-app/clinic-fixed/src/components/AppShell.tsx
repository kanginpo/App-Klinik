"use client";

import React, { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Activity } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Sidebar: fixed on desktop, slide-in on mobile ── */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-30 h-screen transition-transform duration-200 ease-in-out",
          "lg:static lg:translate-x-0 lg:h-auto lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="h-full">
          <Sidebar onClose={closeMobile} />
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={openMobile}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-md">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">PhysioCare</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
