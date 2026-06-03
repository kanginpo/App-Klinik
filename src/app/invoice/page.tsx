"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Printer, Plus, Trash2, Upload, X, Eye, Clock, Search,
  ChevronDown, FileText, CheckCircle, AlertCircle,
} from "lucide-react";
import { useClinic } from "@/lib/ClinicContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Invoice, InvoiceItem, Patient } from "@/types";

// ─── Preset layanan 2026 ──────────────────────────────────────────────────────

const SERVICE_PRESETS = [
  // Health Screening
  { group: "Health Screening", label: "Health Screening Only", price: 50000 },
  // On Clinic
  { group: "On Clinic", label: "1 session – Junior Therapist (On Clinic)", price: 150000 },
  { group: "On Clinic", label: "1 session – Senior Therapist (On Clinic)", price: 250000 },
  { group: "On Clinic", label: "4 session – Senior Therapist (On Clinic)", price: 800000 },
  { group: "On Clinic", label: "8 session – Senior Therapist (On Clinic)", price: 1500000 },
  { group: "On Clinic", label: "12 session – Senior Therapist (On Clinic)", price: 2100000 },
  // Sports Massage
  { group: "Sports Massage", label: "Sports Massage – Full Body (1 session)", price: 400000 },
  { group: "Sports Massage", label: "Sports Massage – Full Body (2 session)", price: 750000 },
  { group: "Sports Massage", label: "Sports Massage – Full Body (4 session)", price: 1400000 },
  { group: "Sports Massage", label: "Sports Massage – Side Regional (1 session)", price: 250000 },
  { group: "Sports Massage", label: "Sports Massage – Side Regional (2 session)", price: 465000 },
  { group: "Sports Massage", label: "Sports Massage – Side Regional (4 session)", price: 870000 },
  // Neuro Home Visit
  { group: "Neuro (Home Visit)", label: "Neuro – 1 session Junior Therapist (Home Visit)", price: 175000 },
  { group: "Neuro (Home Visit)", label: "Neuro – 1 session Senior Therapist (Home Visit)", price: 275000 },
  { group: "Neuro (Home Visit)", label: "Neuro – 4 session (Home Visit)", price: 900000 },
  { group: "Neuro (Home Visit)", label: "Neuro – 8 session (Home Visit)", price: 1700000 },
  // Musculo Home Visit
  { group: "Musculo (Home Visit)", label: "Musculo – 1 session Junior Therapist (Home Visit)", price: 160000 },
  { group: "Musculo (Home Visit)", label: "Musculo – 1 session Senior Therapist (Home Visit)", price: 260000 },
  { group: "Musculo (Home Visit)", label: "Musculo – 4 session (Home Visit)", price: 840000 },
  { group: "Musculo (Home Visit)", label: "Musculo – 8 session (Home Visit)", price: 1580000 },
  // Biaya Tambahan
  { group: "Lainnya", label: "Biaya Transport Extra (per 1-5 km > 10 km)", price: 10000 },
  { group: "Lainnya", label: "Custom / Tulis sendiri", price: 0 },
];

const GROUPS = [...new Set(SERVICE_PRESETS.map((p) => p.group))];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRp = (n: number) =>
  "Rp. " + n.toLocaleString("id-ID").replace(/,/g, ".");

const uid = () => Math.random().toString(36).slice(2, 9);

const getNextInvoiceNumber = () => {
  const stored = localStorage.getItem("klinik_invoice_counter");
  const count = stored ? parseInt(stored) + 1 : 1;
  localStorage.setItem("klinik_invoice_counter", String(count));
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  return `${mm}.${yy}.${String(count).padStart(4, "0")}`;
};

const todayStr = () => new Date().toISOString().split("T")[0];

const formatDateIndo = (iso: string) => {
  const months = ["Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"];
  const [y, m, day] = iso.split("-");
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

// ─── Blank form ───────────────────────────────────────────────────────────────

const blankForm = () => ({
  invoiceNumber: "",
  date: todayStr(),
  patientId: "",
  patientName: "",
  phone: "",
  address: "",
  notes: "Hope your love one getting better soon..",
  discount: 0,
  isPaid: true,
  items: [{ id: uid(), description: "4 session – Senior Therapist (On Clinic)", price: 800000, qty: 1 }] as InvoiceItem[],
});

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "form" | "history";

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function InvoicePage() {
  const { patients, logo: clinicLogo } = useClinic();
  const [invoices, setInvoices, hydrated] = useLocalStorage<Invoice[]>("physiocare-invoices", []);

  const [tab, setTab] = useState<Tab>("form");
  const [form, setForm] = useState(blankForm);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [customDescIdx, setCustomDescIdx] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  // Patient search
  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropOpen, setPatientDropOpen] = useState(false);

  // History
  const [historySearch, setHistorySearch] = useState("");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setForm((p) => ({ ...p, invoiceNumber: getNextInvoiceNumber() }));
    // Use clinic logo if available
    if (clinicLogo) setLogoUrl(clinicLogo);
  }, [clinicLogo]);

  // ── Calcs ──────────────────────────────────────────────────────────────────
  const subtotal = form.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - form.discount);

  // ── Patient autocomplete ───────────────────────────────────────────────────
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientQuery.toLowerCase()) ||
    p.phone.includes(patientQuery)
  ).slice(0, 6);

  const selectPatient = (p: Patient) => {
    setForm((prev) => ({
      ...prev,
      patientId: p.id,
      patientName: p.name,
      phone: p.phone,
      address: p.address || "",
    }));
    setPatientQuery(p.name);
    setPatientDropOpen(false);
  };

  const clearPatient = () => {
    setForm((prev) => ({ ...prev, patientId: "", patientName: "", phone: "", address: "" }));
    setPatientQuery("");
  };

  // ── Item helpers ───────────────────────────────────────────────────────────
  const addItem = () =>
    setForm((p) => ({ ...p, items: [...p.items, { id: uid(), description: "", price: 0, qty: 1 }] }));

  const removeItem = (id: string) =>
    setForm((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) =>
    setForm((p) => ({ ...p, items: p.items.map((i) => i.id === id ? { ...i, [field]: value } : i) }));

  const applyPreset = (id: string, label: string, price: number) => {
    if (label === "Custom / Tulis sendiri") {
      setCustomDescIdx((p) => ({ ...p, [id]: true }));
    } else {
      setCustomDescIdx((p) => ({ ...p, [id]: false }));
      updateItem(id, "description", label);
      updateItem(id, "price", price);
    }
  };

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }, []
  );

  // ── Save invoice ───────────────────────────────────────────────────────────
  const saveInvoice = () => {
    const inv: Invoice = {
      id: uid(),
      invoiceNumber: form.invoiceNumber,
      date: form.date,
      patientId: form.patientId,
      patientName: form.patientName || "Pasien tidak dipilih",
      phone: form.phone,
      address: form.address,
      notes: form.notes,
      items: form.items,
      discount: form.discount,
      subtotal,
      total,
      isPaid: form.isPaid,
      createdAt: new Date().toISOString(),
    };
    setInvoices([inv, ...invoices]);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ ...blankForm(), invoiceNumber: getNextInvoiceNumber() });
    setCustomDescIdx({});
    setPatientQuery("");
    setViewingInvoice(null);
  };

  // ── Load invoice into form (view mode) ─────────────────────────────────────
  const loadInvoiceToView = (inv: Invoice) => {
    setViewingInvoice(inv);
    setTab("form");
    setPreviewMode(true);
    setForm({
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      patientId: inv.patientId,
      patientName: inv.patientName,
      phone: inv.phone,
      address: inv.address,
      notes: inv.notes,
      discount: inv.discount,
      isPaid: inv.isPaid,
      items: inv.items,
    });
    setPatientQuery(inv.patientName);
  };

  // ── Delete invoice ─────────────────────────────────────────────────────────
  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter((i) => i.id !== id));
    if (viewingInvoice?.id === id) { setViewingInvoice(null); resetForm(); }
  };

  // ── History filter ─────────────────────────────────────────────────────────
  const filteredHistory = invoices.filter((inv) =>
    inv.patientName.toLowerCase().includes(historySearch.toLowerCase()) ||
    inv.invoiceNumber.includes(historySearch)
  );

  const setField = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  if (!mounted || !hydrated) return null;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .inv-page { font-family: 'Plus Jakarta Sans', sans-serif; }
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: fixed !important; top:0; left:0; width:100%; background:white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="inv-page min-h-screen bg-gray-50">

        {/* ── Saved banner ── */}
        {savedBanner && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in slide-in-from-top">
            <CheckCircle size={16} /> Invoice tersimpan ke riwayat!
          </div>
        )}

        {/* ── Header ── */}
        <div className="no-print sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">🧾 Invoice</h1>
            <p className="text-xs text-gray-400">FISIOTERAPI.KRI</p>
          </div>
          <div className="flex gap-2">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button onClick={() => { setTab("form"); setViewingInvoice(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${tab === "form" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <FileText size={14} /> Buat Invoice
              </button>
              <button onClick={() => setTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${tab === "history" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Clock size={14} /> Riwayat
                {invoices.length > 0 && (
                  <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">{invoices.length}</span>
                )}
              </button>
            </div>
            {tab === "form" && (
              <>
                <button onClick={() => setPreviewMode((p) => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Eye size={14} /> {previewMode ? "Edit" : "Preview"}
                </button>
                <button onClick={saveInvoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                  <CheckCircle size={14} /> Simpan
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                  <Printer size={14} /> Print PDF
                </button>
                <button onClick={resetForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-300">
                  <X size={14} /> Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            TAB: RIWAYAT
        ════════════════════════════════════════ */}
        {tab === "history" && (
          <div className="no-print max-w-5xl mx-auto p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Cari nama pasien / no. invoice..."
                  value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
              </div>
              <span className="text-sm text-gray-400">{filteredHistory.length} invoice</span>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada riwayat invoice</p>
                <p className="text-sm">Buat invoice pertama kamu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((inv) => (
                  <div key={inv.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${inv.isPaid ? "bg-green-500" : "bg-yellow-400"}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{inv.patientName}</span>
                        <span className="text-xs text-gray-400 font-mono">#{inv.invoiceNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${inv.isPaid ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {inv.isPaid ? "LUNAS" : "BELUM LUNAS"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex gap-3 flex-wrap">
                        <span>{formatDateIndo(inv.date)}</span>
                        <span>·</span>
                        <span>{inv.items.length} item</span>
                        <span>·</span>
                        <span className="font-semibold text-blue-700">{formatRp(inv.total)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => loadInvoiceToView(inv)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100">
                        <Eye size={12} /> Lihat
                      </button>
                      <button onClick={() => deleteInvoice(inv.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100">
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: FORM + PREVIEW
        ════════════════════════════════════════ */}
        {tab === "form" && (
          <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6">

            {/* ── LEFT: FORM ── */}
            {!previewMode && (
              <div className="no-print space-y-4">

                {/* Viewing badge */}
                {viewingInvoice && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700">
                    <AlertCircle size={15} />
                    Sedang melihat invoice #{viewingInvoice.invoiceNumber} —&nbsp;
                    <button onClick={resetForm} className="underline font-semibold">Buat Invoice Baru</button>
                  </div>
                )}

                {/* Aset Klinik */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-semibold text-gray-700 mb-3">Aset Klinik</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Logo Klinik", url: logoUrl, setUrl: setLogoUrl, ref: logoInputRef },
                      { label: "Stempel / TTD", url: stampUrl, setUrl: setStampUrl, ref: stampInputRef },
                    ].map(({ label, url, setUrl, ref }) => (
                      <div key={label}>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
                        <div onClick={() => ref.current?.click()}
                          className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center h-20 hover:border-blue-400 transition relative overflow-hidden">
                          {url ? (
                            <>
                              <img src={url} alt={label} className="h-full w-full object-contain p-2" />
                              <button onClick={(e) => { e.stopPropagation(); setUrl(null); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Upload size={18} className="text-gray-300 mb-1" />
                              <span className="text-xs text-gray-400">Upload {label}</span>
                            </>
                          )}
                        </div>
                        <input ref={ref} type="file" accept="image/*" className="hidden"
                          onChange={(e) => handleImageUpload(e, setUrl)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Invoice */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h2 className="font-semibold text-gray-700">Info Invoice</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">No. Invoice</label>
                      <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={form.invoiceNumber} onChange={setField("invoiceNumber")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Tanggal</label>
                      <input type="date" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={form.date} onChange={setField("date")} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isPaid" className="w-4 h-4 accent-blue-600"
                      checked={form.isPaid}
                      onChange={(e) => setForm((p) => ({ ...p, isPaid: e.target.checked }))} />
                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-600">Tandai sebagai LUNAS</label>
                  </div>
                </div>

                {/* Pilih Pasien */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h2 className="font-semibold text-gray-700">Pasien</h2>

                  {/* Autocomplete */}
                  <div className="relative">
                    <label className="text-xs font-medium text-gray-500">Cari Pasien dari Database</label>
                    <div className="mt-1 flex gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Ketik nama atau no. HP..."
                          value={patientQuery}
                          onChange={(e) => { setPatientQuery(e.target.value); setPatientDropOpen(true); setForm((p) => ({ ...p, patientId: "" })); }}
                          onFocus={() => setPatientDropOpen(true)}
                        />
                      </div>
                      {form.patientId && (
                        <button onClick={clearPatient} className="px-3 py-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {patientDropOpen && patientQuery && filteredPatients.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {filteredPatients.map((p) => (
                          <button key={p.id}
                            onClick={() => selectPatient(p)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.phone}</p>
                            </div>
                            {form.patientId === p.id && <CheckCircle size={14} className="text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {form.patientId && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
                      <CheckCircle size={14} /> Pasien terhubung: <strong>{form.patientName}</strong>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Nama Pasien (di invoice)</label>
                      <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Px. Nama Pasien" value={form.patientName} onChange={setField("patientName")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">No. HP</label>
                      <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="081234567890" value={form.phone} onChange={setField("phone")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Alamat</label>
                      <textarea className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        rows={2} placeholder="Jl. Contoh No. 1" value={form.address} onChange={setField("address")} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Pesan / Catatan</label>
                      <input className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={form.notes} onChange={setField("notes")} />
                    </div>
                  </div>
                </div>

                {/* Item Layanan */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h2 className="font-semibold text-gray-700">Item Layanan</h2>

                  {form.items.map((item, idx) => (
                    <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">Item {idx + 1}</span>
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        )}
                      </div>

                      {/* Grouped select */}
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onChange={(e) => {
                          const preset = SERVICE_PRESETS.find((p) => p.label === e.target.value);
                          if (preset) applyPreset(item.id, preset.label, preset.price);
                        }}
                        value={customDescIdx[item.id] ? "Custom / Tulis sendiri" : item.description}
                      >
                        <option value="" disabled>-- Pilih layanan --</option>
                        {GROUPS.map((g) => (
                          <optgroup key={g} label={g}>
                            {SERVICE_PRESETS.filter((p) => p.group === g).map((p) => (
                              <option key={p.label} value={p.label}>{p.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {customDescIdx[item.id] && (
                        <input className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Tulis deskripsi layanan..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)} />
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
                      <div className="text-right text-xs font-bold text-blue-700">
                        Subtotal: {formatRp(item.price * item.qty)}
                      </div>
                    </div>
                  ))}

                  <button onClick={addItem}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-200 text-blue-500 hover:bg-blue-50 rounded-xl py-2 text-sm font-medium transition">
                    <Plus size={15} /> Tambah Item
                  </button>

                  <div>
                    <label className="text-xs font-medium text-gray-500">Diskon (Rp)</label>
                    <input type="number" min={0}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={form.discount}
                      onChange={(e) => setForm((p) => ({ ...p, discount: parseFloat(e.target.value) || 0 }))} />
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Sub total</span><span>{formatRp(subtotal)}</span>
                    </div>
                    {form.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Diskon</span><span>- {formatRp(form.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-blue-800 border-t border-blue-200 pt-1">
                      <span>TOTAL</span><span>{formatRp(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RIGHT: INVOICE PREVIEW ── */}
            <div className={previewMode ? "col-span-full max-w-2xl mx-auto w-full" : ""}>
              <div className="print-area bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)" }}
                  className="px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="logo" className="h-10 w-10 flex-shrink-0 object-contain bg-white rounded-full p-1" />
                      ) : (
                        <div className="h-10 w-10 flex-shrink-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-white font-black text-base">F</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-black text-base leading-tight truncate">FISIOTERAPI.KRI</p>
                        <p className="text-blue-200 text-xs">Klinik Fisioterapi Profesional</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-white font-black text-lg leading-tight tracking-wider whitespace-nowrap">INVOICE LUNAS</p>
                      <p className="text-blue-200 text-xs">#{form.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-blue-100">
                    <span className="font-medium">Invoice # {form.invoiceNumber}</span>
                    <span>·</span>
                    <span>Date : {formatDateIndo(form.date)}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Invoice To</p>
                    <p className="text-xl font-black text-gray-800 mt-0.5">{form.patientName || "Px. Nama Pasien"}</p>
                  </div>

                  {/* Table */}
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "linear-gradient(90deg,#1a73e8,#1565c0)" }}>
                          <th className="text-left px-3 py-2.5 text-white font-semibold text-xs w-8">SL.</th>
                          <th className="text-left px-3 py-2.5 text-white font-semibold text-xs">ITEM DESCRIPTION</th>
                          <th className="text-right px-3 py-2.5 text-white font-semibold text-xs">PRICE</th>
                          <th className="text-center px-3 py-2.5 text-white font-semibold text-xs w-10">QTY</th>
                          <th className="text-right px-3 py-2.5 text-white font-semibold text-xs">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2.5 text-gray-400 font-semibold text-xs">{idx + 1}.</td>
                            <td className="px-3 py-2.5 text-gray-700 text-xs">{item.description || "-"}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700 text-xs">{formatRp(item.price)}</td>
                            <td className="px-3 py-2.5 text-center text-gray-700 text-xs">{item.qty}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-gray-800 text-xs">{formatRp(item.price * item.qty)}</td>
                          </tr>
                        ))}
                        {form.items.length < 3 && Array.from({ length: 3 - form.items.length }).map((_, i) => (
                          <tr key={"p"+i} className={(form.items.length + i) % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2.5 text-gray-200 text-xs">-</td>
                            <td /><td /><td /><td />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                      <div className="flex justify-end gap-10 text-xs text-gray-500">
                        <span className="font-medium">Sub total</span><span>{formatRp(subtotal)}</span>
                      </div>
                      <div className="flex justify-end gap-10 text-xs text-gray-500">
                        <span className="font-medium">Discount</span>
                        <span>{form.discount > 0 ? "- " + formatRp(form.discount) : "-"}</span>
                      </div>
                      <div className="flex justify-end gap-6 mt-1.5">
                        <span className="font-black text-sm text-white px-3 py-1 rounded-lg"
                          style={{ background: "linear-gradient(90deg,#1a73e8,#1565c0)" }}>Total</span>
                        <span className="font-black text-sm text-blue-800">{formatRp(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stamp + note */}
                  <div className="flex items-end justify-between gap-4">
                    <p className="text-xs italic text-gray-400 max-w-[60%]">{form.notes}</p>
                    {form.isPaid && (
                      stampUrl ? (
                        <img src={stampUrl} alt="stamp" className="w-24 h-24 object-contain opacity-90 flex-shrink-0" />
                      ) : (
                        <div className="flex-shrink-0" style={{
                          width: 80, height: 80, border: "3px solid #e57373",
                          borderRadius: "50%", display: "flex", alignItems: "center",
                          justifyContent: "center", transform: "rotate(-15deg)", opacity: 0.85,
                        }}>
                          <span style={{ color: "#e57373", fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>PAID</span>
                        </div>
                      )
                    )}
                  </div>

                  {(form.phone || form.address) && (
                    <>
                      <hr className="border-gray-100" />
                      <div>
                        <p className="text-sm font-black text-gray-800 mb-1.5">Payment Info :</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          {form.phone && <div className="flex gap-4"><span className="w-24 text-gray-400">Phone Number</span><span>: {form.phone}</span></div>}
                          {form.address && <div className="flex gap-4"><span className="w-24 text-gray-400 flex-shrink-0">Address</span><span>: {form.address}</span></div>}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ background: "linear-gradient(90deg,#1a73e8,#1565c0)" }} className="px-6 py-2.5 text-center">
                  <p className="text-white text-xs opacity-70">Terima kasih atas kepercayaan Anda · FISIOTERAPI.KRI</p>
                </div>
              </div>

              <p className="no-print text-center text-xs text-gray-400 mt-2">
                Klik "Simpan" untuk menyimpan ke riwayat · "Print PDF" untuk cetak
              </p>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
