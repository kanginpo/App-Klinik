"use client";

import React, { useState, useRef } from "react";
import { Trash2, Download, Upload, AlertTriangle, ImagePlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useClinic } from "@/lib/ClinicContext";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Estimate localStorage usage */
function estimateStorageKB() {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    total += (localStorage.getItem(key) || "").length;
  }
  return (total / 1024).toFixed(0);
}

export default function SettingsPage() {
  const {
    patients, setPatients,
    appointments, setAppointments,
    transactions, setTransactions,
    patientFiles, setPatientFiles,
    logo, setLogo,
  } = useClinic();

  const [showClearModal, setShowClearModal] = useState(false);
  const [storageKB, setStorageKB] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ── Logo handlers ── */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Pilih file gambar (PNG, JPG, SVG, dll.)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran logo maksimal 2 MB.");
      return;
    }
    const b64 = await fileToBase64(file);
    setLogo(b64);
    e.target.value = "";
  };

  /* ── Backup / Restore ── */
  const exportData = () => {
    const data = { patients, appointments, transactions, patientFiles, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `physiocare-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.patients)     setPatients(data.patients);
        if (data.appointments) setAppointments(data.appointments);
        if (data.transactions) setTransactions(data.transactions);
        if (data.patientFiles) setPatientFiles(data.patientFiles);
        alert("Data berhasil diimpor!");
      } catch {
        alert("File cadangan tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearAll = () => {
    setPatients([]); setAppointments([]); setTransactions([]);
    setPatientFiles([]); setLogo(null);
    setShowClearModal(false);
  };

  const totalFileSize = patientFiles.reduce((s, f) => s + f.sizeBytes, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-500 text-sm mt-0.5">Kelola tampilan dan data klinik Anda</p>
      </div>

      {/* ══ LOGO KLINIK ══ */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Klinik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload logo klinik Anda (PNG, JPG, atau SVG, maks. 2 MB). Logo akan tampil di
            sidebar dan header aplikasi.
          </p>

          {/* Preview */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
              {logo ? (
                <img src={logo} alt="Logo preview" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center text-gray-300">
                  <ImagePlus className="w-7 h-7 mx-auto" />
                  <p className="text-xs mt-1">Belum ada</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1.5" />
                {logo ? "Ganti Logo" : "Upload Logo"}
              </Button>
              {logo && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50 w-full"
                  onClick={() => setLogo(null)}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Hapus Logo
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Tips: gunakan logo dengan latar belakang transparan (PNG) agar terlihat rapi.
          </p>
        </CardContent>
      </Card>

      {/* ══ RINGKASAN DATA ══ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ringkasan Data</CardTitle>
          <button
            className="text-xs text-blue-500 hover:underline"
            onClick={() => setStorageKB(estimateStorageKB())}
          >
            Cek ukuran penyimpanan
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Pasien",      value: patients.length },
              { label: "Jadwal",      value: appointments.length },
              { label: "Transaksi",   value: transactions.length },
              { label: "File Pasien", value: patientFiles.length },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {patientFiles.length > 0 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Total ukuran file pasien: <strong>{formatBytes(totalFileSize)}</strong>
            </p>
          )}

          {storageKB && (
            <p className="text-xs text-blue-600 mt-2 text-center">
              Estimasi penyimpanan terpakai: <strong>{storageKB} KB</strong> (batas browser ~5 MB)
            </p>
          )}

          <p className="text-xs text-gray-400 mt-3 text-center">
            Semua data disimpan lokal di browser Anda. Tidak ada data yang dikirim ke server.
          </p>
        </CardContent>
      </Card>

      {/* ══ CADANGAN & PEMULIHAN ══ */}
      <Card>
        <CardHeader>
          <CardTitle>Cadangan & Pemulihan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Ekspor semua data (termasuk file pasien) sebagai satu file JSON, atau impor
            cadangan sebelumnya.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-1.5" />
              Ekspor Cadangan
            </Button>
            <label>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-1.5" />
                Impor Cadangan
              </Button>
              <input type="file" accept=".json" className="hidden" onChange={importData} />
            </label>
          </div>
          <p className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
            ⚠️ Impor akan menimpa semua data yang ada saat ini.
          </p>
        </CardContent>
      </Card>

      {/* ══ ZONA BERBAHAYA ══ */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona Berbahaya</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Hapus permanen semua data dan file dari perangkat ini. Tidak dapat dibatalkan.
          </p>
          <Button variant="danger" onClick={() => setShowClearModal(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Hapus Semua Data
          </Button>
        </CardContent>
      </Card>

      {/* Modal Konfirmasi */}
      <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Hapus Semua Data">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Apakah Anda benar-benar yakin?</p>
            <p className="text-sm text-gray-500 mt-1">
              Ini akan menghapus {patients.length} pasien, {appointments.length} jadwal,{" "}
              {transactions.length} transaksi, dan {patientFiles.length} file pasien.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setShowClearModal(false)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={clearAll}>Ya, Hapus Semua</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
