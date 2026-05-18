"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Trash2,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Patient } from "@/types";
import { generateId, formatDate } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";

export default function PatientsPage() {
  const { patients, setPatients, isHydrated } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      ...newPatient,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPatients([...patients, patient]);
    setIsModalOpen(false);
    setNewPatient({ name: "", email: "", phone: "", dateOfBirth: "" });
  };

  const handleDelete = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
    setDeleteId(null);
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
          <p className="text-gray-500 text-sm mt-0.5">
            {patients.length} pasien terdaftar
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Pasien
        </Button>
      </div>

      {/* Pencarian */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          className="w-full h-10 pl-9 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cari berdasarkan nama, email, atau telepon…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid pasien */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {searchTerm
              ? "Tidak ada pasien yang sesuai pencarian."
              : "Belum ada pasien terdaftar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((patient) => (
            <Card
              key={patient.id}
              className="hover:border-blue-200 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 w-11 h-11 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={() => setDeleteId(patient.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tambah Pasien */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Pasien Baru"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Nama Lengkap"
            required
            autoFocus
            value={newPatient.name}
            onChange={(e) =>
              setNewPatient({ ...newPatient, name: e.target.value })
            }
          />
          <Input
            label="Alamat Email"
            type="email"
            required
            value={newPatient.email}
            onChange={(e) =>
              setNewPatient({ ...newPatient, email: e.target.value })
            }
          />
          <Input
            label="Nomor Telepon"
            type="tel"
            required
            value={newPatient.phone}
            onChange={(e) =>
              setNewPatient({ ...newPatient, phone: e.target.value })
            }
          />
          <Input
            label="Tanggal Lahir"
            type="date"
            required
            value={newPatient.dateOfBirth}
            onChange={(e) =>
              setNewPatient({ ...newPatient, dateOfBirth: e.target.value })
            }
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
              Simpan Pasien
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Pasien"
      >
        <p className="text-sm text-gray-600 mb-4">
          Apakah Anda yakin ingin menghapus pasien ini? Tindakan ini tidak dapat
          dibatalkan.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDeleteId(null)}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => deleteId && handleDelete(deleteId)}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
}
