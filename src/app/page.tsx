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
"use client";

import { useState, useRef, useCallback } from "react";
import { Printer, Plus, Trash2, Upload, X, Download, Eye } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string;
  description: string;
  price: number;
  qty: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  patientName: string;
  phone: string;
  address: string;
  notes: string;
  discount: number;
  isPaid: boolean;
  items: InvoiceItem[];
}

// ─── Preset layanan fisioterapi ───────────────────────────────────────────────

const SERVICE_PRESETS = [
  { label: "1 session, Senior physio On clinic", price: 200000 },
  { label: "4 session, Senior physio On clinic", price: 800000 },
  { label: "8 session, Senior physio On clinic", price: 1500000 },
  { label: "1 session, Home visit physio", price: 350000 },
  { label: "4 session, Home visit physio", price: 1300000 },
  { label: "Konsultasi fisioterapi", price: 150000 },
  { label: "Terapi TENS / EMS", price: 100000 },
  { label: "Terapi ultrasound", price: 120000 },
  { label: "Terapi laser", price: 150000 },
  { label: "Terapi dry needling", price: 200000 },
  { label: "Kinesio taping", price: 100000 },
  { label: "Manual therapy", price: 250000 },
  { label: "Custom / Tulis sendiri", price: 0 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRp = (n: number) =>
  "Rp. " + n.toLocaleString("id-ID").replace(/,/g, ".");

const uid = () => Math.random().toString(36).slice(2, 8);

const nextInvoiceNumber = () => {
  const stored = localStorage.getItem("klinik_invoice_counter");
  const count = stored ? parseInt(stored) + 1 : 1;
  localStorage.setItem("klinik_invoice_counter", String(count));
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  return `${mm}.${yy}.${String(count).padStart(4, "0")}`;
};

const todayStr = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const formatDateIndo = (iso: string) => {
  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  const [y, m, day] = iso.split("-");
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
};

// ─── Default state ────────────────────────────────────────────────────────────

const defaultInvoice = (): InvoiceData => ({
  invoiceNumber: nextInvoiceNumber(),
  date: todayStr(),
  patientName: "",
  phone: "",
  address: "",
  notes: "Hope your love one getting better soon..",
  discount: 0,
  isPaid: true,
  items: [
    {
      id: uid(),
      description: "4 session, Senior physio On clinic",
      price: 800000,
      qty: 1,
    },
  ],
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoice);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [customDescIdx, setCustomDescIdx] = useState<Record<string, boolean>>({});

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Calculations ────────────────────────────────────────────────────────────
  const subtotal = invoice.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - invoice.discount);

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const addItem = () =>
    setInvoice((p) => ({
      ...p,
      items: [
        ...p.items,
        { id: uid(), description: "", price: 0, qty: 1 },
      ],
    }));

  const removeItem = (id: string) =>
    setInvoice((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) =>
    setInvoice((p) => ({
      ...p,
      items: p.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }));

  const applyPreset = (id: string, label: string, price: number) => {
    if (label === "Custom / Tulis sendiri") {
      setCustomDescIdx((p) => ({ ...p, [id]: true }));
      updateItem(id, "price", price);
    } else {
      setCustomDescIdx((p) => ({ ...p, [id]: false }));
      updateItem(id, "description", label);
      updateItem(id, "price", price);
    }
  };

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  // ── Print / Save ─────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setInvoice(defaultInvoice());
    setCustomDescIdx({});
  };

  // ── Field update shorthand ───────────────────────────────────────────────────
  const set = (field: keyof InvoiceData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setInvoice((p) => ({ ...p, [field]: e.target.value }));

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ── Print styles injected via style tag ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .invoice-page { font-family: 'Plus Jakarta Sans', sans-serif; }

        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: fixed !important;
            top: 0; left: 0;
            width: 100%; height: auto;
            background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="invoice-page min-h-screen bg-gray-50 p-4 md:p-8">

        {/* ── Top toolbar ── */}
        <div className="no-print max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🧾 Pembuat Invoice</h1>
            <p className="text-sm text-gray-500">FISIOTERAPI.KRI – Invoice Lunas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPreviewMode((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Eye size={16} />
              {previewMode ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
            >
              <X size={16} />
              Reset
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* ══════════════════════════════════════════
              LEFT – FORM INPUT (no-print)
          ══════════════════════════════════════════ */}
          {!previewMode && (
            <div className="no-print space-y-5">

              {/* Upload assets */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-700 mb-4">Aset Klinik</h2>
                <div className="grid grid-cols-2 gap-4">

                  {/* Logo */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Logo Klinik</p>
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center h-24 hover:border-blue-400 transition relative overflow-hidden"
                    >
                      {logoUrl ? (
                        <>
                          <img src={logoUrl} alt="logo" className="h-full w-full object-contain p-2" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setLogoUrl(null); }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-gray-400 mb-1" />
                          <span className="text-xs text-gray-400">Upload Logo</span>
                        </>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleImageUpload(e, setLogoUrl)} />
                  </div>

                  {/* Stamp / TTD */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Stempel / TTD</p>
                    <div
                      onClick={() => stampInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center h-24 hover:border-blue-400 transition relative overflow-hidden"
                    >
                      {stampUrl ? (
                        <>
                          <img src={stampUrl} alt="stamp" className="h-full w-full object-contain p-2" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setStampUrl(null); }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-gray-400 mb-1" />
                          <span className="text-xs text-gray-400">Upload Stempel/TTD</span>
                        </>
                      )}
                    </div>
                    <input ref={stampInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleImageUpload(e, setStampUrl)} />
                  </div>
                </div>
              </div>

              {/* Info Invoice */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                <h2 className="font-semibold text-gray-700">Info Invoice</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">No. Invoice</label>
                    <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={invoice.invoiceNumber} onChange={set("invoiceNumber")} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Tanggal</label>
                    <input type="date" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={invoice.date} onChange={set("date")} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isPaid" className="w-4 h-4 accent-blue-600"
                    checked={invoice.isPaid}
                    onChange={(e) => setInvoice((p) => ({ ...p, isPaid: e.target.checked }))} />
                  <label htmlFor="isPaid" className="text-sm font-medium text-gray-600">Tandai sebagai LUNAS</label>
                </div>
              </div>

              {/* Info Pasien */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                <h2 className="font-semibold text-gray-700">Info Pasien</h2>
                <div>
                  <label className="text-xs font-medium text-gray-500">Nama Pasien</label>
                  <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Px. Nathanael H" value={invoice.patientName} onChange={set("patientName")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">No. HP</label>
                  <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="081234567890" value={invoice.phone} onChange={set("phone")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Alamat</label>
                  <textarea className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    rows={3} placeholder="Jl. Contoh No. 1, Kota" value={invoice.address} onChange={set("address")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Pesan / Catatan</label>
                  <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={invoice.notes} onChange={set("notes")} />
                </div>
              </div>

              {/* Item Layanan */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                <h2 className="font-semibold text-gray-700">Item Layanan</h2>

                {invoice.items.map((item, idx) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">Item {idx + 1}</span>
                      {invoice.items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown preset */}
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      onChange={(e) => {
                        const preset = SERVICE_PRESETS.find((p) => p.label === e.target.value);
                        if (preset) applyPreset(item.id, preset.label, preset.price);
                      }}
                      value={customDescIdx[item.id] ? "Custom / Tulis sendiri" : item.description}
                    >
                      <option value="" disabled>-- Pilih layanan --</option>
                      {SERVICE_PRESETS.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>

                    {/* Custom description (shown when custom selected) */}
                    {customDescIdx[item.id] && (
                      <input
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Tulis deskripsi layanan..."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Harga (Rp)</label>
                        <input type="number" min={0}
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Qty</label>
                        <input type="number" min={1}
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value) || 1)} />
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-blue-700">
                      Subtotal: {formatRp(item.price * item.qty)}
                    </div>
                  </div>
                ))}

                <button onClick={addItem}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 rounded-xl py-2 text-sm font-medium transition">
                  <Plus size={16} /> Tambah Item
                </button>

                {/* Discount */}
                <div>
                  <label className="text-xs font-medium text-gray-500">Diskon (Rp)</label>
                  <input type="number" min={0}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={invoice.discount}
                    onChange={(e) => setInvoice((p) => ({ ...p, discount: parseFloat(e.target.value) || 0 }))} />
                </div>

                {/* Summary */}
                <div className="mt-2 rounded-xl bg-blue-50 p-3 space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sub total</span><span>{formatRp(subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Diskon</span><span>- {formatRp(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-blue-800 border-t border-blue-200 pt-1 mt-1">
                    <span>TOTAL</span><span>{formatRp(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              RIGHT – INVOICE PREVIEW (print-area)
          ══════════════════════════════════════════ */}
          <div className={previewMode ? "col-span-full max-w-2xl mx-auto w-full" : ""}>
            <div ref={printRef} className="print-area bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

              {/* Header band */}
              <div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)" }}
                className="px-7 pt-7 pb-5">
                <div className="flex items-center justify-between">
                  {/* Logo + clinic name */}
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" className="h-12 w-12 object-contain bg-white rounded-full p-1" />
                    ) : (
                      <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-white font-black text-lg">F</span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-black text-lg leading-none tracking-wide">FISIOTERAPI.KRI</p>
                      <p className="text-blue-200 text-xs mt-0.5">Klinik Fisioterapi Profesional</p>
                    </div>
                  </div>

                  {/* Invoice Lunas badge */}
                  <div className="text-right">
                    <p className="text-white font-black text-2xl md:text-3xl tracking-widest">INVOICE LUNAS</p>
                    <p className="text-blue-200 text-xs mt-1">#{invoice.invoiceNumber}</p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="mt-4 flex gap-4 text-sm text-blue-100">
                  <span className="font-medium">Invoice # {invoice.invoiceNumber}</span>
                  <span>·</span>
                  <span>Date : {formatDateIndo(invoice.date)}</span>
                </div>
              </div>

              {/* Body */}
              <div className="px-7 py-6 space-y-5">

                {/* Invoice To */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Invoice To</p>
                  <p className="text-xl font-black text-gray-800 mt-1">
                    {invoice.patientName || "Px. Nama Pasien"}
                  </p>
                </div>

                {/* Items table */}
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "linear-gradient(90deg, #1a73e8, #1565c0)" }}>
                        <th className="text-left px-4 py-2.5 text-white font-semibold text-xs uppercase tracking-wider w-8">SL.</th>
                        <th className="text-left px-4 py-2.5 text-white font-semibold text-xs uppercase tracking-wider">ITEM DESCRIPTION</th>
                        <th className="text-right px-4 py-2.5 text-white font-semibold text-xs uppercase tracking-wider">PRICE</th>
                        <th className="text-center px-4 py-2.5 text-white font-semibold text-xs uppercase tracking-wider w-12">QTY.</th>
                        <th className="text-right px-4 py-2.5 text-white font-semibold text-xs uppercase tracking-wider">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 text-gray-500 font-semibold">{idx + 1}.</td>
                          <td className="px-4 py-3 text-gray-700">{item.description || "-"}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{formatRp(item.price)}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{item.qty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatRp(item.price * item.qty)}</td>
                        </tr>
                      ))}
                      {/* Padding rows */}
                      {invoice.items.length < 4 &&
                        Array.from({ length: 4 - invoice.items.length }).map((_, i) => (
                          <tr key={"pad-" + i} className={((invoice.items.length + i) % 2 === 0) ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 text-gray-300">-</td>
                            <td className="px-4 py-3" /><td /><td /><td />
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>

                  {/* Totals row */}
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
                    <div className="flex justify-end gap-12 text-sm text-gray-500">
                      <span className="font-medium">Sub total</span>
                      <span>{formatRp(subtotal)}</span>
                    </div>
                    <div className="flex justify-end gap-12 text-sm text-gray-500">
                      <span className="font-medium">Discount</span>
                      <span>{invoice.discount > 0 ? "- " + formatRp(invoice.discount) : "-"}</span>
                    </div>
                    <div className="flex justify-end gap-8 mt-2">
                      <span className="font-black text-base text-white px-4 py-1.5 rounded-lg" style={{ background: "linear-gradient(90deg, #1a73e8, #1565c0)" }}>
                        Total
                      </span>
                      <span className="font-black text-base text-blue-800">{formatRp(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Stamp + note row */}
                <div className="flex items-end justify-between">
                  {/* Note */}
                  <p className="text-sm italic text-gray-500 max-w-xs">{invoice.notes}</p>

                  {/* Stamp / TTD */}
                  <div className="relative">
                    {invoice.isPaid && (
                      <div className="absolute -top-2 -left-2 z-10">
                        {stampUrl ? (
                          <img src={stampUrl} alt="stamp" className="w-28 h-28 object-contain opacity-90" />
                        ) : (
                          /* Default PAID stamp visual */
                          <div style={{
                            width: 100, height: 100,
                            border: "4px solid #e57373",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: "rotate(-15deg)",
                            opacity: 0.85,
                          }}>
                            <span style={{
                              color: "#e57373",
                              fontWeight: 900,
                              fontSize: 22,
                              letterSpacing: 2,
                            }}>PAID</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Payment Info */}
                {(invoice.phone || invoice.address) && (
                  <div>
                    <p className="text-base font-black text-gray-800 mb-2">Payment Info :</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {invoice.phone && (
                        <div className="flex gap-4">
                          <span className="w-28 text-gray-400">Phone Number</span>
                          <span>: {invoice.phone}</span>
                        </div>
                      )}
                      {invoice.address && (
                        <div className="flex gap-4">
                          <span className="w-28 text-gray-400 flex-shrink-0">Address</span>
                          <span>: {invoice.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer band */}
              <div style={{ background: "linear-gradient(90deg, #1a73e8, #1565c0)" }}
                className="px-7 py-3 text-center">
                <p className="text-white text-xs opacity-75">Terima kasih atas kepercayaan Anda · FISIOTERAPI.KRI</p>
              </div>
            </div>

            {/* Print hint */}
            <p className="no-print text-center text-xs text-gray-400 mt-3">
              Klik "Print / Save PDF" untuk menyimpan invoice sebagai file PDF
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
