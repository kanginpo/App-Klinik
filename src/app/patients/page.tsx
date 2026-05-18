"use client";

import React, { useState, useRef } from "react";
import {
  Plus, Search, Mail, Phone, Calendar as CalendarIcon,
  Trash2, User, FileText, Upload, Download, X, Paperclip,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Patient, PatientFile } from "@/types";
import { generateId, formatDate, cn } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";

/* ── Helpers ── */
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

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  return "📎";
}

/* ── Patient File Manager Modal ── */
function FileManagerModal({
  patient,
  files,
  onClose,
  onAddFiles,
  onDeleteFile,
}: {
  patient: Patient;
  files: PatientFile[];
  onClose: () => void;
  onAddFiles: (files: PatientFile[]) => void;
  onDeleteFile: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // 10 MB per file limit
    const oversized = selected.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      alert(`File berikut melebihi 10 MB:\n${oversized.map((f) => f.name).join("\n")}`);
      return;
    }

    setUploading(true);
    const newFiles: PatientFile[] = await Promise.all(
      selected.map(async (f) => ({
        id: generateId(),
        patientId: patient.id,
        name: f.name,
        mimeType: f.type,
        sizeBytes: f.size,
        data: await fileToBase64(f),
        uploadedAt: new Date().toISOString(),
      }))
    );
    onAddFiles(newFiles);
    setUploading(false);
    e.target.value = "";
  };

  const downloadFile = (pf: PatientFile) => {
    const a = document.createElement("a");
    a.href = pf.data;
    a.download = pf.name;
    a.click();
  };

  return (
    <Modal isOpen onClose={onClose} title={`File – ${patient.name}`}>
      <div className="space-y-4">
        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">
            Klik untuk upload file
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            PDF, gambar, Word, Excel — maks. 10 MB per file
          </p>
        </div>

        {uploading && (
          <p className="text-xs text-blue-500 text-center animate-pulse">
            Mengunggah…
          </p>
        )}

        {/* File list */}
        {files.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada file untuk pasien ini.</p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((pf) => (
              <li
                key={pf.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl flex-shrink-0">{fileIcon(pf.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{pf.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatBytes(pf.sizeBytes)} · {formatDate(pf.uploadedAt)}
                  </p>
                </div>
                <button
                  onClick={() => downloadFile(pf)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  title="Unduh"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteFile(pf.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Hapus"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Total: {files.length} file · {formatBytes(files.reduce((s, f) => s + f.sizeBytes, 0))}
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ══════════════════ Main Page ══════════════════ */
export default function PatientsPage() {
  const { patients, setPatients, patientFiles, setPatientFiles, isHydrated } = useClinic();

  const [searchTerm, setSearchTerm]     = useState("");
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [filePatient, setFilePatient]   = useState<Patient | null>(null);
  const [newPatient, setNewPatient]     = useState({ name: "", email: "", phone: "", dateOfBirth: "" });

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  const filesFor = (patientId: string) =>
    patientFiles.filter((f) => f.patientId === patientId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = { ...newPatient, id: generateId(), createdAt: new Date().toISOString() };
    setPatients([...patients, patient]);
    setIsAddOpen(false);
    setNewPatient({ name: "", email: "", phone: "", dateOfBirth: "" });
  };

  const handleDelete = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
    setPatientFiles(patientFiles.filter((f) => f.patientId !== id));
    setDeleteId(null);
  };

  const handleAddFiles = (newFiles: PatientFile[]) => {
    setPatientFiles([...patientFiles, ...newFiles]);
  };

  const handleDeleteFile = (fileId: string) => {
    setPatientFiles(patientFiles.filter((f) => f.id !== fileId));
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
          <h1 className="text-2xl font-bold text-gray-900">Pasien</h1>
          <p className="text-gray-500 text-sm mt-0.5">{patients.length} pasien terdaftar</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Pasien
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className="w-full h-10 pl-9 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cari berdasarkan nama, email, atau telepon…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {searchTerm ? "Tidak ada pasien yang sesuai pencarian." : "Belum ada pasien terdaftar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((patient) => {
            const pFiles = filesFor(patient.id);
            return (
              <Card key={patient.id} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={() => setDeleteId(patient.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info */}
                  <h3 className="font-bold text-gray-900 mb-2">{patient.name}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      {patient.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      Tgl Lahir: {formatDate(patient.dateOfBirth)}
                    </div>
                  </div>

                  {/* File button */}
                  <button
                    onClick={() => setFilePatient(patient)}
                    className={cn(
                      "mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                      pFiles.length > 0
                        ? "border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    {pFiles.length > 0
                      ? `${pFiles.length} file tersimpan`
                      : "Kelola File Pasien"}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add patient modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Pasien Baru">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Nama Lengkap" required autoFocus value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
          <Input label="Alamat Email" type="email" required value={newPatient.email}
            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
          <Input label="Nomor Telepon" type="tel" required value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
          <Input label="Tanggal Lahir" type="date" required value={newPatient.dateOfBirth}
            onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} />
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Batal</Button>
            <Button type="submit" className="flex-1">Simpan Pasien</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Pasien">
        <p className="text-sm text-gray-600 mb-4">
          Apakah Anda yakin? Pasien dan semua file-nya akan dihapus permanen.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Batal</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Hapus</Button>
        </div>
      </Modal>

      {/* File manager modal */}
      {filePatient && (
        <FileManagerModal
          patient={filePatient}
          files={filesFor(filePatient.id)}
          onClose={() => setFilePatient(null)}
          onAddFiles={handleAddFiles}
          onDeleteFile={handleDeleteFile}
        />
      )}
    </div>
  );
}
