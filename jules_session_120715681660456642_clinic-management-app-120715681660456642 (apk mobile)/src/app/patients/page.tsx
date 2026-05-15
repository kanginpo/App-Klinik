"use client";

import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, Calendar as CalendarIcon, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Patient } from '@/types';
import { generateId, formatDate } from '@/lib/utils';
import { useClinic } from '@/lib/ClinicContext';

export default function PatientsPage() {
  const { patients, setPatients } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      ...newPatient,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPatients([...patients, patient]);
    setIsModalOpen(false);
    setNewPatient({ name: '', email: '', phone: '', dateOfBirth: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pasien</h1>
          <p className="text-gray-500">Kelola dan lihat data pasien Anda.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pasien
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari pasien berdasarkan nama, email, atau telepon..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {patient.name.charAt(0)}
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{patient.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {patient.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {patient.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Lahir: {formatDate(patient.dateOfBirth)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Pasien Baru"
      >
        <form onSubmit={handleAddPatient} className="space-y-4">
          <Input 
            label="Nama Lengkap" 
            required 
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
          />
          <Input 
            label="Alamat Email" 
            type="email" 
            required 
            value={newPatient.email}
            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
          />
          <Input 
            label="Nomor Telepon" 
            required 
            value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
          />
          <Input 
            label="Tanggal Lahir" 
            type="date" 
            required 
            value={newPatient.dateOfBirth}
            onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
          />
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Simpan Pasien
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
