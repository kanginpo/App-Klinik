"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Clock, User, ClipboardList, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Search, CreditCard,
  Wallet, TrendingUp, X, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Appointment, AppointmentStatus, Patient } from "@/types";
import { generateId, formatCurrency, cn } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameMonth, isSameDay, addMonths, subMonths, parseISO, isValid,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Pricelist preset ────────────────────────────────────────────────────────

const SERVICE_PRESETS = [
  { group: "Health Screening", label: "Health Screening Only", price: 50000 },
  { group: "On Clinic", label: "1 session – Junior Therapist", price: 150000 },
  { group: "On Clinic", label: "1 session – Senior Therapist", price: 250000 },
  { group: "On Clinic", label: "4 session – Senior Therapist", price: 800000 },
  { group: "On Clinic", label: "8 session – Senior Therapist", price: 1500000 },
  { group: "On Clinic", label: "12 session – Senior Therapist", price: 2100000 },
  { group: "Sports Massage", label: "Sports Massage – Full Body (1 session)", price: 400000 },
  { group: "Sports Massage", label: "Sports Massage – Full Body (2 session)", price: 750000 },
  { group: "Sports Massage", label: "Sports Massage – Full Body (4 session)", price: 1400000 },
  { group: "Sports Massage", label: "Sports Massage – Side Regional (1 session)", price: 250000 },
  { group: "Sports Massage", label: "Sports Massage – Side Regional (2 session)", price: 465000 },
  { group: "Sports Massage", label: "Sports Massage – Side Regional (4 session)", price: 870000 },
  { group: "Neuro Home Visit", label: "Neuro – 1 sesi Junior (Home Visit)", price: 175000 },
  { group: "Neuro Home Visit", label: "Neuro – 1 sesi Senior (Home Visit)", price: 275000 },
  { group: "Neuro Home Visit", label: "Neuro – 4 sesi (Home Visit)", price: 900000 },
  { group: "Neuro Home Visit", label: "Neuro – 8 sesi (Home Visit)", price: 1700000 },
  { group: "Musculo Home Visit", label: "Musculo – 1 sesi Junior (Home Visit)", price: 160000 },
  { group: "Musculo Home Visit", label: "Musculo – 1 sesi Senior (Home Visit)", price: 260000 },
  { group: "Musculo Home Visit", label: "Musculo – 4 sesi (Home Visit)", price: 840000 },
  { group: "Musculo Home Visit", label: "Musculo – 8 sesi (Home Visit)", price: 1580000 },
  { group: "Lainnya", label: "Biaya Transport Extra (per 1-5 km)", price: 10000 },
  { group: "Lainnya", label: "Custom / Tulis sendiri", price: 0 },
];
const SERVICE_GROUPS = [...new Set(SERVICE_PRESETS.map((p) => p.group))];

// Jam pilihan 07:00 – 20:00
const TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  const h = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const m = String(totalMin % 60).padStart(2, "0");
  return `${h}:${m}`;
});

// ─── Payment status ───────────────────────────────────────────────────────────
type PaymentStatus = "lunas" | "dp" | "hutang";

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; color: string; dot: string }> = {
  lunas:  { label: "Lunas",   color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  dp:     { label: "DP",      color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  hutang: { label: "Terhutang", color: "bg-red-100 text-red-600",    dot: "bg-red-500" },
};

// ─── Calendar indicator colors per appointment ────────────────────────────────
const PASTEL_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-orange-500",
  "bg-pink-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500",
];
function colorForName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return PASTEL_COLORS[h % PASTEL_COLORS.length];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: "Terjadwal",   color: "bg-blue-100 text-blue-700",   icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Selesai",     color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Dibatalkan",  color: "bg-red-100 text-red-700",     icon: <XCircle className="w-3 h-3" /> },
  "no-show": { label: "Tidak Hadir", color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle className="w-3 h-3" /> },
};

const HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// ─── Extended Appointment type (payment fields stored in notes JSON) ──────────
// We store paymentStatus and dpAmount in the notes field as JSON to avoid
// schema changes. Format: "PAYMENT:{"status":"dp","dp":50000}|<notes>"
function encodeNotes(payStatus: PaymentStatus, dpAmount: number, notes: string) {
  return `PAYMENT:${JSON.stringify({ status: payStatus, dp: dpAmount })}|${notes}`;
}
function decodeNotes(raw: string | undefined): { payStatus: PaymentStatus; dpAmount: number; notes: string } {
  if (!raw) return { payStatus: "lunas", dpAmount: 0, notes: "" };
  if (raw.startsWith("PAYMENT:")) {
    const sep = raw.indexOf("|");
    try {
      const meta = JSON.parse(raw.slice(8, sep));
      return { payStatus: meta.status || "lunas", dpAmount: meta.dp || 0, notes: raw.slice(sep + 1) };
    } catch { return { payStatus: "lunas", dpAmount: 0, notes: raw.slice(sep + 1) }; }
  }
  return { payStatus: "lunas", dpAmount: 0, notes: raw };
}

// ═════════════════════════════════════════════════════════════════════════════
// MINI CALENDAR – Google Calendar style
// ═════════════════════════════════════════════════════════════════════════════
function MiniKalender({
  appointments, selectedDate, onSelect,
}: { appointments: Appointment[]; selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const apptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [appointments]);

  const start = startOfMonth(viewMonth);
  const end = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: localeId })}
        </span>
        <button onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {HARI_SINGKAT.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = apptsByDate[key] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const inMonth = isSameMonth(day, viewMonth);

          return (
            <button key={key} onClick={() => onSelect(day)}
              className={cn(
                "relative flex flex-col items-center rounded-lg py-1 text-xs transition-colors group",
                isSelected ? "bg-blue-600" : isToday ? "bg-blue-50" : inMonth ? "hover:bg-gray-100" : ""
              )}>
              <span className={cn(
                "font-medium",
                isSelected ? "text-white" : isToday ? "text-blue-700 font-bold" : inMonth ? "text-gray-700" : "text-gray-300"
              )}>
                {format(day, "d")}
              </span>

              {/* Indicator dots / names (max 2) */}
              {dayAppts.length > 0 && (
                <div className="flex flex-col gap-px w-full px-0.5 mt-0.5">
                  {dayAppts.slice(0, 2).map((ap) => {
                    const { payStatus } = decodeNotes(ap.notes);
                    const dotColor = payStatus === "lunas" ? colorForName(ap.patientName)
                      : payStatus === "dp" ? "bg-yellow-400" : "bg-red-500";
                    return (
                      <div key={ap.id}
                        className={cn("w-full rounded-sm text-white text-[9px] leading-tight px-0.5 truncate hidden sm:block", dotColor)}>
                        {ap.patientName.split(" ")[0]}
                      </div>
                    );
                  })}
                  {dayAppts.length > 2 && (
                    <div className="text-[9px] text-gray-400 text-center">+{dayAppts.length - 2}</div>
                  )}
                  {/* Mobile: just a dot */}
                  <div className={cn("w-1.5 h-1.5 rounded-full mx-auto sm:hidden",
                    colorForName(dayAppts[0].patientName))} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function SchedulePage() {
  const { appointments, setAppointments, transactions, setTransactions, patients, isHydrated } = useClinic();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropOpen, setPatientDropOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    treatmentType: "",
    customTreatment: "",
    price: 0,
    paymentStatus: "lunas" as PaymentStatus,
    dpAmount: 0,
    notes: "",
  });
  const [isCustomTreatment, setIsCustomTreatment] = useState(false);

  // Summary panel
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Patient autocomplete
  const filteredPatients = useMemo(() =>
    patients.filter((p) =>
      p.name.toLowerCase().includes(patientQuery.toLowerCase()) ||
      p.phone.includes(patientQuery)
    ).slice(0, 6),
    [patients, patientQuery]
  );

  const selectPatient = (p: Patient) => {
    setForm((prev) => ({ ...prev, patientId: p.id, patientName: p.name }));
    setPatientQuery(p.name);
    setPatientDropOpen(false);
  };

  // Apply preset
  const applyPreset = (label: string, price: number) => {
    if (label === "Custom / Tulis sendiri") {
      setIsCustomTreatment(true);
      setForm((p) => ({ ...p, treatmentType: "", price: 0 }));
    } else {
      setIsCustomTreatment(false);
      setForm((p) => ({ ...p, treatmentType: label, price }));
    }
  };

  // Calculated values per appointment
  const getAmountPaid = (app: Appointment) => {
    const { payStatus, dpAmount } = decodeNotes(app.notes);
    if (payStatus === "lunas") return app.price;
    if (payStatus === "dp") return dpAmount;
    return 0;
  };

  const getDebt = (app: Appointment) => {
    const { payStatus, dpAmount } = decodeNotes(app.notes);
    if (payStatus === "lunas") return 0;
    if (payStatus === "dp") return app.price - dpAmount;
    return app.price;
  };

  // Summary stats
  const totalRevenue = useMemo(() =>
    appointments.filter((a) => a.status !== "cancelled").reduce((s, a) => s + getAmountPaid(a), 0),
    [appointments]
  );
  const totalDebt = useMemo(() =>
    appointments.filter((a) => a.status !== "cancelled").reduce((s, a) => s + getDebt(a), 0),
    [appointments]
  );

  // Day appointments
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const dayAppts = useMemo(() =>
    appointments.filter((a) => a.date === selectedKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments, selectedKey]
  );

  const allSorted = useMemo(() =>
    [...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [appointments]
  );

  const openModal = () => {
    setForm((p) => ({
      ...p,
      date: format(selectedDate, "yyyy-MM-dd"),
      patientId: "", startTime: "", treatmentType: "",
      customTreatment: "", price: 0,
      paymentStatus: "lunas", dpAmount: 0, notes: "",
    }));
    setPatientQuery("");
    setIsCustomTreatment(false);
    setIsModalOpen(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const treatmentLabel = isCustomTreatment ? form.customTreatment : form.treatmentType;
    const encodedNotes = encodeNotes(form.paymentStatus, form.dpAmount, form.notes);
    const appId = generateId();

    const app: Appointment = {
      id: appId,
      patientId: form.patientId || "manual",
      patientName: form.patientName,
      date: form.date,
      startTime: form.startTime,
      endTime: "",
      status: "scheduled",
      treatmentType: treatmentLabel,
      price: form.price,
      notes: encodedNotes,
    };

    setAppointments([...appointments, app]);

    // Only add to transactions if paid/dp
    if (form.paymentStatus !== "hutang") {
      const paid = form.paymentStatus === "lunas" ? form.price : form.dpAmount;
      setTransactions([{
        id: generateId(),
        date: new Date().toISOString(),
        amount: paid,
        type: "revenue",
        category: "Perawatan",
        description: `${treatmentLabel} – ${form.patientName}${form.paymentStatus === "dp" ? " (DP)" : ""}`,
        appointmentId: appId,
      }, ...transactions]);
    }

    setIsModalOpen(false);
  };

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(appointments.map((a) => a.id === id ? { ...a, status } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
  };

  // Mark as paid (hutang/dp → lunas)
  const markAsLunas = (app: Appointment) => {
    const { notes } = decodeNotes(app.notes);
    const newNotes = encodeNotes("lunas", 0, notes);
    setAppointments(appointments.map((a) => a.id === app.id ? { ...a, notes: newNotes } : a));
    // Add remaining to transactions
    const remaining = getDebt(app);
    if (remaining > 0) {
      setTransactions([{
        id: generateId(),
        date: new Date().toISOString(),
        amount: remaining,
        type: "revenue",
        category: "Perawatan",
        description: `Pelunasan – ${app.patientName} (${app.treatmentType})`,
        appointmentId: app.id,
      }, ...transactions]);
    }
  };

  if (!isHydrated) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Memuat…</div></div>;
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal</h1>
          <p className="text-gray-500 text-sm mt-0.5">{appointments.length} jadwal tersimpan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSummaryOpen(true)}>
            <TrendingUp className="w-4 h-4 mr-1.5" /> Ringkasan
          </Button>
          <Button onClick={openModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Jadwal Baru
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <p className="text-xs text-green-600 font-medium">Total Pendapatan</p>
          <p className="text-lg font-black text-green-700 mt-0.5">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-xs text-red-500 font-medium">Total Terhutang</p>
          <p className="text-lg font-black text-red-600 mt-0.5">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 col-span-2 md:col-span-1">
          <p className="text-xs text-blue-600 font-medium">Hari Ini</p>
          <p className="text-lg font-black text-blue-700 mt-0.5">{dayAppts.length} sesi</p>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT: Calendar + day list */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <MiniKalender appointments={appointments} selectedDate={selectedDate} onSelect={setSelectedDate} />
            </CardContent>
          </Card>

          {/* Day detail */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm capitalize">
                {format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}
                <span className="ml-2 text-xs text-gray-400 font-normal">{dayAppts.length} sesi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dayAppts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Tidak ada jadwal</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {dayAppts.map((app) => {
                    const { payStatus } = decodeNotes(app.notes);
                    const pmCfg = PAYMENT_CONFIG[payStatus];
                    const dotColor = colorForName(app.patientName);
                    return (
                      <li key={app.id} className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className={cn("w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0", dotColor)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{app.patientName}</p>
                            <p className="text-xs text-gray-500">{app.startTime} · {app.treatmentType}</p>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">{formatCurrency(app.price)}</p>
                          </div>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", pmCfg.color)}>
                            {pmCfg.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: All appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Semua Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allSorted.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">Belum ada jadwal.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {allSorted.map((app) => {
                    const cfg = STATUS_CONFIG[app.status];
                    const { payStatus, dpAmount } = decodeNotes(app.notes);
                    const pmCfg = PAYMENT_CONFIG[payStatus];
                    const appDate = parseISO(app.date);
                    const dotColor = colorForName(app.patientName);
                    const debt = getDebt(app);

                    return (
                      <li key={app.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        {/* Date badge */}
                        <div className={cn("flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[48px] text-center text-white", dotColor)}>
                          <span className="text-[10px] font-semibold uppercase leading-none capitalize">
                            {format(appDate, "MMM", { locale: localeId })}
                          </span>
                          <span className="text-lg font-bold leading-none mt-0.5">
                            {format(appDate, "d")}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{app.patientName}</span>
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", pmCfg.color)}>
                              {pmCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                            <Clock className="w-3 h-3" />{app.startTime}
                            <ClipboardList className="w-3 h-3 ml-1" />{app.treatmentType}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                            <span className="font-bold text-gray-800">{formatCurrency(app.price)}</span>
                            {payStatus === "dp" && (
                              <span className="text-yellow-600">DP: {formatCurrency(dpAmount)} · Sisa: {formatCurrency(debt)}</span>
                            )}
                            {payStatus === "hutang" && (
                              <span className="text-red-500">Belum bayar: {formatCurrency(debt)}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <select value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as AppointmentStatus)}
                            className={cn("text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500", cfg.color)}>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>

                          {(payStatus === "dp" || payStatus === "hutang") && (
                            <button onClick={() => markAsLunas(app)}
                              className="text-[10px] flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold">
                              <Check className="w-3 h-3" /> Lunaskan
                            </button>
                          )}
                          <button onClick={() => deleteAppointment(app.id)}
                            className="text-[10px] text-red-400 hover:text-red-600">
                            Hapus
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL TAMBAH JADWAL
      ══════════════════════════════════════════ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Jadwal Baru">
        <form onSubmit={handleAdd} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

          {/* Pilih pasien */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari Pasien dari Database</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ketik nama / HP..."
                value={patientQuery}
                onChange={(e) => { setPatientQuery(e.target.value); setPatientDropOpen(true); setForm((p) => ({ ...p, patientId: "", patientName: e.target.value })); }}
                onFocus={() => setPatientDropOpen(true)} />
              {patientDropOpen && patientQuery && filteredPatients.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredPatients.map((p) => (
                    <button key={p.id} type="button" onClick={() => selectPatient(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.phone}</p>
                      </div>
                      {form.patientId === p.id && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.patientId && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung: {form.patientName}
              </p>
            )}
          </div>

          {/* Nama manual jika tidak dari DB */}
          {!form.patientId && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pasien *</label>
              <input required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Nama lengkap pasien"
                value={form.patientName}
                onChange={(e) => setForm((p) => ({ ...p, patientName: e.target.value }))} />
            </div>
          )}

          {/* Tanggal + Jam */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal *</label>
              <input type="date" required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jam Kedatangan *</label>
              <select required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}>
                <option value="" disabled>-- Pilih jam --</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Jenis layanan */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Layanan *</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={isCustomTreatment ? "Custom / Tulis sendiri" : form.treatmentType}
              onChange={(e) => {
                const preset = SERVICE_PRESETS.find((p) => p.label === e.target.value);
                if (preset) applyPreset(preset.label, preset.price);
              }}>
              <option value="" disabled>-- Pilih layanan --</option>
              {SERVICE_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {SERVICE_PRESETS.filter((p) => p.group === g).map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {isCustomTreatment && (
              <input className="mt-2 w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Tulis jenis layanan..."
                value={form.customTreatment}
                onChange={(e) => setForm((p) => ({ ...p, customTreatment: e.target.value }))} />
            )}
          </div>

          {/* Harga */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Harga (Rp) *</label>
            <input type="number" min={0} step={1000} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.price || ""}
              onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
          </div>

          {/* Status pembayaran */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Status Pembayaran *</label>
            <div className="grid grid-cols-3 gap-2">
              {(["lunas", "dp", "hutang"] as PaymentStatus[]).map((s) => {
                const cfg = PAYMENT_CONFIG[s];
                return (
                  <button key={s} type="button"
                    onClick={() => setForm((p) => ({ ...p, paymentStatus: s }))}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition",
                      form.paymentStatus === s ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}>
                    {s === "lunas" && <CreditCard className="w-4 h-4" />}
                    {s === "dp" && <Wallet className="w-4 h-4" />}
                    {s === "hutang" && <AlertCircle className="w-4 h-4" />}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DP amount (only if dp) */}
          {form.paymentStatus === "dp" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jumlah DP (Rp) — Sisa: {formatCurrency(Math.max(0, form.price - form.dpAmount))}
              </label>
              <input type="number" min={0} max={form.price} step={1000}
                className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.dpAmount || ""}
                onChange={(e) => setForm((p) => ({ ...p, dpAmount: parseFloat(e.target.value) || 0 }))} />
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (opsional)</label>
            <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Catatan tambahan..."
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          {/* Hutang warning */}
          {form.paymentStatus === "hutang" && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Jadwal ini belum ada pembayaran. Tidak akan masuk ke total pendapatan sampai dilunasi.
            </div>
          )}
          {form.paymentStatus === "dp" && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5 text-xs text-yellow-700">
              <Wallet className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Hanya DP yang akan masuk ke total pendapatan. Sisa akan masuk saat dilunasi.
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1">Simpan Jadwal</Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL RINGKASAN KEUANGAN
      ══════════════════════════════════════════ */}
      <Modal isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} title="Ringkasan Keuangan Jadwal">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium">Total Diterima</p>
              <p className="text-xl font-black text-green-700 mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-500 font-medium">Total Terhutang</p>
              <p className="text-xl font-black text-red-600 mt-1">{formatCurrency(totalDebt)}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail Terhutang</p>
          {appointments.filter((a) => getDebt(a) > 0 && a.status !== "cancelled").length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Tidak ada hutang 🎉</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {appointments.filter((a) => getDebt(a) > 0 && a.status !== "cancelled").map((app) => {
                const { payStatus, dpAmount } = decodeNotes(app.notes);
                return (
                  <li key={app.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{app.patientName}</p>
                      <p className="text-xs text-gray-400">{format(parseISO(app.date), "d MMM yyyy", { locale: localeId })} · {app.treatmentType}</p>
                      {payStatus === "dp" && <p className="text-xs text-yellow-600">DP: {formatCurrency(dpAmount)}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-red-600">{formatCurrency(getDebt(app))}</p>
                      <button onClick={() => { markAsLunas(app); }}
                        className="text-xs text-green-600 font-semibold hover:underline mt-0.5">
                        Lunaskan
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Modal>

    </div>
  );
}
