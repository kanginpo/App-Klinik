"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, DollarSign, Settings, Activity, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dasbor",      href: "/" },
  { icon: Users,           label: "Pasien",       href: "/patients" },
  { icon: Calendar,        label: "Jadwal",        href: "/schedule" },
  { icon: DollarSign,      label: "Keuangan",     href: "/finance" },
  { icon: Settings,        label: "Pengaturan",   href: "/settings" },
];

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const { logo } = useClinic();

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo ? (
            <img
              src={logo}
              alt="Logo klinik"
              className="h-9 w-auto max-w-[160px] object-contain rounded"
            />
          ) : (
            <>
              <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight truncate">
                PhysioCare
              </span>
            </>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 text-xs text-gray-400">
          PhysioCare v1.0 · Data tersimpan lokal
        </div>
      </div>
    </aside>
  );
};
