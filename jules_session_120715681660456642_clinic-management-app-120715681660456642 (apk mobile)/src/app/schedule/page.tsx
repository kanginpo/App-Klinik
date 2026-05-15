"use client";

import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, User, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Appointment } from '@/types';
import { generateId, formatDate } from '@/lib/utils';
import { useClinic } from '@/lib/ClinicContext';

export default function SchedulePage() {
  const { appointments, setAppointments, transactions, setTransactions } = useClinic();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    patientName: '',
    date: '',
    startTime: '',
    treatmentType: '',
    price: '',
  });

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newApp.price);
    const appId = generateId();
    
    const app: Appointment = {
      id: appId,
      patientId: 'new',
      patientName: newApp.patientName,
      date: newApp.date,
      startTime: newApp.startTime,
      endTime: '',
      status: 'scheduled',
      treatmentType: newApp.treatmentType,
      price: price,
    };
    
    const trans = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: price,
      type: 'revenue' as const,
      category: 'Perawatan',
      description: `${newApp.treatmentType} - ${newApp.patientName}`,
      appointmentId: appId,
    };

    setAppointments([...appointments, app]);
    setTransactions([trans, ...transactions]);
    setIsModalOpen(false);
    setNewApp({ patientName: '', date: '', startTime: '', treatmentType: '', price: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Janji Temu</h1>
          <p className="text-gray-500">Rencanakan dan kelola kunjungan pasien.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Janji Temu Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Mendatang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.length > 0 ? appointments.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map((app) => (
                  <div key={app.id} className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-lg p-3 min-w-[80px]">
                        <span className="text-xs font-semibold uppercase">{formatDate(app.date).split(',')[0]}</span>
                        <span className="text-xl font-bold">{new Date(app.date).getDate()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{app.patientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {app.startTime}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ClipboardList className="w-4 h-4 text-gray-400" />
                          {app.treatmentType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {app.status === 'scheduled' ? 'Terjadwal' : app.status}
                      </span>
                      <p className="mt-2 font-bold text-gray-900">Rp {app.price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">Belum ada jadwal yang direncanakan.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Kalender</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64 bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Integrasi kalender</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Janji Temu"
      >
        <form onSubmit={handleAddAppointment} className="space-y-4">
          <Input 
            label="Nama Pasien" 
            required 
            value={newApp.patientName}
            onChange={(e) => setNewApp({ ...newApp, patientName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Tanggal" 
              type="date" 
              required 
              value={newApp.date}
              onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
            />
            <Input 
              label="Waktu Mulai" 
              type="time" 
              required 
              value={newApp.startTime}
              onChange={(e) => setNewApp({ ...newApp, startTime: e.target.value })}
            />
          </div>
          <Input 
            label="Jenis Perawatan" 
            required 
            placeholder="misal: Fisioterapi"
            value={newApp.treatmentType}
            onChange={(e) => setNewApp({ ...newApp, treatmentType: e.target.value })}
          />
          <Input 
            label="Harga (Rp)" 
            type="number" 
            required 
            value={newApp.price}
            onChange={(e) => setNewApp({ ...newApp, price: e.target.value })}
          />
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Konfirmasi Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
