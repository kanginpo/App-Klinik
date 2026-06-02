"use client";

import React from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";

// Nama hari dalam Bahasa Indonesia (indeks 0 = Minggu)
const NAMA_HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Dashboard() {
  const { patients, appointments, transactions, isHydrated } = useClinic();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Memuat…</div>
      </div>
    );
  }

  const totals = {
    revenue: transactions
      .filter((t) => t.type === "revenue")
      .reduce((s, t) => s + t.amount, 0),
    cost: transactions
      .filter((t) => t.type === "cost")
      .reduce((s, t) => s + t.amount, 0),
  };
  const labasBersih = totals.revenue - totals.cost;

  // Data grafik mingguan
  const dataGrafik = NAMA_HARI.map((name) => ({ name, pendapatan: 0, pengeluaran: 0 }));
  transactions.forEach((t) => {
    const idx = new Date(t.date).getDay();
    const dp = dataGrafik[idx];
    if (dp) {
      if (t.type === "revenue") dp.pendapatan += t.amount;
      else dp.pengeluaran += t.amount;
    }
  });

  const jadwalMendatang = [...appointments]
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Total Pendapatan",
      value: formatCurrency(totals.revenue),
      icon: TrendingUp,
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(totals.cost),
      icon: TrendingDown,
      bg: "bg-red-100",
      color: "text-red-600",
    },
    {
      label: "Laba Bersih",
      value: formatCurrency(labasBersih),
      icon: DollarSign,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      label: "Total Pasien",
      value: String(patients.length),
      icon: Users,
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dasbor</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Selamat datang! Berikut ringkasan klinik Anda.
        </p>
      </div>

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 truncate">
                    {s.label}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 truncate">
                    {s.value}
                  </p>
                </div>
                <div className={`${s.bg} p-2 rounded-lg flex-shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan vs Pengeluaran (per hari)</CardTitle>
          </CardHeader>
          <CardContent className="h-56 sm:h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGrafik} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Pendapatan" />
                <Bar dataKey="pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren Laba</CardTitle>
          </CardHeader>
          <CardContent className="h-56 sm:h-72 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataGrafik.map((d) => ({
                  ...d,
                  laba: d.pendapatan - d.pengeluaran,
                }))}
                margin={{ left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="laba"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Laba"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Jadwal mendatang */}
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Mendatang</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jadwalMendatang.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {jadwalMendatang.map((app) => (
                <li key={app.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {app.patientName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {app.treatmentType}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Clock className="w-3 h-3" />
                      {app.startTime}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(app.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 py-10 text-sm">
              Belum ada jadwal mendatang
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
