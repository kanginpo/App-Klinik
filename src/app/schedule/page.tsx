"use client";

import React, { useState } from "react";
import {
  Plus,
  Clock,
  User,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Appointment, AppointmentStatus } from "@/types";
import { generateId, formatCurrency, cn } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isValid,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  scheduled: {
    label: "Terjadwal",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="w-3 h-3" />,
  },
  completed: {
    label: "Selesai",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3 h-3" />,
  },
  "no-show": {
    label: "Tidak Hadir",
    color: "bg-yellow-100 text-yellow-700",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

// Hari dalam Bahasa Indonesia, dimulai dari Minggu
const HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function MiniKalender({
  appointments,
  selectedDate,
  onSelect,
}: {
  appointments: Appointment[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const start = startOfMonth(viewMonth);
  const end = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start);

  const apptDates = new Set(
    appointments.map((a) => {
      try {
        const d = parseISO(a.date);
        return isValid(d) ? format(d, "yyyy-MM-dd") : "";
      } catch {
        return "";
      }
    })
  );

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: localeId })}
        </span>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Header hari */}
      <div className="grid grid-cols-7 mb-1">
        {HARI_SINGKAT.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid tanggal */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const hasAppt = apptDates.has(key);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const inMonth = isSameMonth(day, viewMonth);

          return (
            <button
              key={key}
              onClick={() => onSelect(day)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg py-1 text-sm transition-colors",
                isSelected
                  ? "bg-blue-600 text-white"
                  : isToday
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : inMonth
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-300"
              )}
            >
              {format(day, "d")}
              {hasAppt && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const {
    appointments,
    setAppointments,
    transactions,
    setTransactions,
    isHydrated,
  } = useClinic();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    patientName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    treatmentType: "",
    price: "",
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newApp.price);
    const appId = generateId();

    const app: Appointment = {
      id: appId,
      patientId: "manual",
      patientName: newApp.patientName,
      date: newApp.date,
      startTime: newApp.startTime,
      endTime: "",
      status: "scheduled",
      treatmentType: newApp.treatmentType,
      price,
    };

    const trans = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: price,
      type: "revenue" as const,
      category: "Perawatan",
      description: `${newApp.treatmentType} – ${newApp.patientName}`,
      appointmentId: appId,
    };

    setAppointments([...appointments, app]);
    setTransactions([trans, ...transactions]);
    setIsModalOpen(false);
    setNewApp({
      patientName: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: "",
      treatmentType: "",
      price: "",
    });
  };

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(
      appointments.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const dayAppts = appointments
    .filter((a) => a.date === selectedKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const allSorted = [...appointments].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );

  const openModal = () => {
    setNewApp((p) => ({ ...p, date: format(selectedDate, "yyyy-MM-dd") }));
    setIsModalOpen(true);
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Memuat…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {appointments.length} jadwal tersimpan
          </p>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4 mr-1.5" />
          Jadwal Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kiri: Kalender + tampilan hari */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <MiniKalender
                appointments={appointments}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm capitalize">
                {format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dayAppts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Tidak ada jadwal
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {dayAppts.map((app) => {
                    const cfg = STATUS_CONFIG[app.status];
                    return (
                      <li key={app.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {app.patientName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {app.startTime} · {app.treatmentType}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                              cfg.color
                            )}
                          >
                            {cfg.icon}
                            {cfg.label}
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

        {/* Kanan: Semua jadwal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Semua Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allSorted.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">
                  Belum ada jadwal yang dibuat.
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {allSorted.map((app) => {
                    const cfg = STATUS_CONFIG[app.status];
                    const appDate = parseISO(app.date);
                    return (
                      <li
                        key={app.id}
                        className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-xl px-3 py-2 min-w-[52px] text-center">
                          <span className="text-xs font-semibold uppercase leading-none capitalize">
                            {format(appDate, "MMM", { locale: localeId })}
                          </span>
                          <span className="text-xl font-bold leading-none mt-0.5">
                            {format(appDate, "d")}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-gray-900 text-sm truncate">
                              {app.patientName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {app.startTime}
                            <ClipboardList className="w-3 h-3 ml-1" />
                            {app.treatmentType}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              updateStatus(
                                app.id,
                                e.target.value as AppointmentStatus
                              )
                            }
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500",
                              cfg.color
                            )}
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(app.price)}
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
      </div>

      {/* Modal Tambah Jadwal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwal Baru"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Nama Pasien"
            required
            autoFocus
            value={newApp.patientName}
            onChange={(e) =>
              setNewApp({ ...newApp, patientName: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal"
              type="date"
              required
              value={newApp.date}
              onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
            />
            <Input
              label="Jam"
              type="time"
              required
              value={newApp.startTime}
              onChange={(e) =>
                setNewApp({ ...newApp, startTime: e.target.value })
              }
            />
          </div>
          <Input
            label="Jenis Perawatan"
            required
            placeholder="cth. Fisioterapi, Terapi Manual"
            value={newApp.treatmentType}
            onChange={(e) =>
              setNewApp({ ...newApp, treatmentType: e.target.value })
            }
          />
          <Input
            label="Harga (Rp)"
            type="number"
            min="0"
            step="1000"
            required
            placeholder="0"
            value={newApp.price}
            onChange={(e) => setNewApp({ ...newApp, price: e.target.value })}
          />
          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Konfirmasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
