"use client";

import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Transaction } from '@/types';
import { generateId, formatCurrency, formatDate, cn } from '@/lib/utils';
import { useClinic } from '@/lib/ClinicContext';

export default function FinancePage() {
  const { transactions, setTransactions } = useClinic();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState({
    amount: '',
    type: 'revenue' as 'revenue' | 'cost',
    category: '',
    description: '',
  });

  const totals = transactions.reduce((acc, curr) => {
    if (curr.type === 'revenue') acc.revenue += curr.amount;
    else acc.cost += curr.amount;
    return acc;
  }, { revenue: 0, cost: 0 });

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const trans: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      amount: parseFloat(newTrans.amount),
      type: newTrans.type,
      category: newTrans.category,
      description: newTrans.description,
    };
    setTransactions([trans, ...transactions]);
    setIsModalOpen(false);
    setNewTrans({ amount: '', type: 'revenue', category: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keuangan & Biaya</h1>
          <p className="text-gray-500">Lacak pendapatan dan biaya operasional klinik Anda.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Ekspor
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-green-900">{formatCurrency(totals.revenue)}</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Total Biaya</p>
                <h3 className="text-2xl font-bold text-red-900">{formatCurrency(totals.cost)}</h3>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Pendapatan Bersih</p>
                <h3 className="text-2xl font-bold text-blue-900">{formatCurrency(totals.revenue - totals.cost)}</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaksi Terbaru</CardTitle>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 font-semibold text-gray-500 text-sm">Tanggal</th>
                  <th className="pb-4 font-semibold text-gray-500 text-sm">Deskripsi</th>
                  <th className="pb-4 font-semibold text-gray-500 text-sm">Kategori</th>
                  <th className="pb-4 font-semibold text-gray-500 text-sm text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length > 0 ? transactions.map((trans) => (
                  <tr key={trans.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-sm text-gray-600">{formatDate(trans.date)}</td>
                    <td className="py-4">
                      <p className="font-medium text-gray-900">{trans.description}</p>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {trans.category}
                      </span>
                    </td>
                    <td className={cn(
                      "py-4 text-sm font-bold text-right",
                      trans.type === 'revenue' ? "text-green-600" : "text-red-600"
                    )}>
                      {trans.type === 'revenue' ? '+' : '-'}{formatCurrency(trans.amount)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">Belum ada transaksi yang dicatat.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Transaksi"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              className={cn(
                "py-2 text-sm font-medium rounded-md transition-colors",
                newTrans.type === 'revenue' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setNewTrans({ ...newTrans, type: 'revenue' })}
            >
              Pendapatan
            </button>
            <button
              type="button"
              className={cn(
                "py-2 text-sm font-medium rounded-md transition-colors",
                newTrans.type === 'cost' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setNewTrans({ ...newTrans, type: 'cost' })}
            >
              Biaya
            </button>
          </div>
          <Input 
            label="Jumlah (Rp)" 
            type="number" 
            required 
            value={newTrans.amount}
            onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
          />
          <Input 
            label="Kategori" 
            required 
            placeholder="misal: Perawatan, Alat, Sewa"
            value={newTrans.category}
            onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
          />
          <Input 
            label="Deskripsi" 
            required 
            value={newTrans.description}
            onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })}
          />
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              Tambah Catatan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
