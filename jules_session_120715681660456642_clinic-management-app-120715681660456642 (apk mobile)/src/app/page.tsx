"use client";

import React from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { useClinic } from '@/lib/ClinicContext';

export default function Dashboard() {
  const { patients, appointments, transactions } = useClinic();

  const stats = {
    totalRevenue: transactions.filter(t => t.type === 'revenue').reduce((acc, t) => acc + t.amount, 0),
    totalCost: transactions.filter(t => t.type === 'cost').reduce((acc, t) => acc + t.amount, 0),
    patientCount: patients.length,
    appointmentCount: appointments.length,
  };

  const netProfit = stats.totalRevenue - stats.totalCost;

  const revenueData = [
    { name: 'Sen', revenue: 0, cost: 0 },
    { name: 'Sel', revenue: 0, cost: 0 },
    { name: 'Rab', revenue: 0, cost: 0 },
    { name: 'Kam', revenue: 0, cost: 0 },
    { name: 'Jum', revenue: 0, cost: 0 },
    { name: 'Sab', revenue: 0, cost: 0 },
    { name: 'Min', revenue: 0, cost: 0 },
  ];

  transactions.forEach(t => {
    const day = new Date(t.date).getDay();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayName = days[day];
    const dataPoint = revenueData.find(d => d.name === dayName);
    if (dataPoint) {
      if (t.type === 'revenue') dataPoint.revenue += t.amount;
      else dataPoint.cost += t.amount;
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Klinik</h1>
        <p className="text-gray-500">Selamat datang kembali! Inilah yang terjadi hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Biaya</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCost)}</h3>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Laba Bersih</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(netProfit)}</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pasien</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.patientCount}</h3>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan vs Biaya (Mingguan)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren Laba</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData.map(d => ({ ...d, profit: d.revenue - d.cost }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Mendatang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.length > 0 ? appointments.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{app.patientName}</p>
                    <p className="text-sm text-gray-500">{app.treatmentType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{app.startTime}</p>
                  <p className="text-xs text-gray-500 text-uppercase">{app.date}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 py-4">Tidak ada jadwal mendatang</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
