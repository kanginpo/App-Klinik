"use client";

import React, { useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Transaction } from "@/types";
import { generateId, formatCurrency, formatDate, cn } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";

type FilterType = "all" | "revenue" | "cost";
const FILTER_LABELS: Record<FilterType, string> = {
  all: "Semua",
  revenue: "Pendapatan",
  cost: "Pengeluaran",
};

export default function FinancePage() {
  const { transactions, setTransactions, isHydrated } = useClinic();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [newTrans, setNewTrans] = useState({
    amount: "",
    type: "revenue" as "revenue" | "cost",
    category: "",
    description: "",
  });

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "revenue") acc.revenue += t.amount;
      else acc.cost += t.amount;
      return acc;
    },
    { revenue: 0, cost: 0 }
  );

  const filtered =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const handleAdd = (e: React.FormEvent) => {
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
    setNewTrans({ amount: "", type: "revenue", category: "", description: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus transaksi ini?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Tanggal", "Keterangan", "Kategori", "Jenis", "Jumlah"],
      ...transactions.map((t) => [
        formatDate(t.date),
        t.description,
        t.category,
        t.type === "revenue" ? "Pendapatan" : "Pengeluaran",
        t.amount.toFixed(0),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transaksi.csv";
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keuangan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Pantau pendapatan dan pengeluaran klinik</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Pendapatan</p>
                <p className="text-2xl font-bold text-green-900 mt-0.5">{formatCurrency(totals.revenue)}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Pengeluaran</p>
                <p className="text-2xl font-bold text-red-900 mt-0.5">{formatCurrency(totals.cost)}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Laba Bersih</p>
                <p className="text-2xl font-bold text-blue-900 mt-0.5">{formatCurrency(totals.revenue - totals.cost)}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel transaksi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaksi</CardTitle>
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {(["all", "revenue", "cost"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  filter === f
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Jumlah</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-6 py-3 font-medium text-gray-900 max-w-[180px] truncate">{t.description}</td>
                      <td className="hidden sm:table-cell px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {t.category}
                        </span>
                      </td>
                      <td className={cn("px-6 py-3 font-bold text-right whitespace-nowrap",
                        t.type === "revenue" ? "text-green-600" : "text-red-600"
                      )}>
                        {t.type === "revenue" ? "+" : "−"}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah Transaksi */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Transaksi">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            {(["revenue", "cost"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={cn(
                  "py-2 text-sm font-medium rounded-lg transition-colors",
                  newTrans.type === t
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setNewTrans({ ...newTrans, type: t })}
              >
                {t === "revenue" ? "Pendapatan" : "Pengeluaran"}
              </button>
            ))}
          </div>
          <Input
            label="Jumlah (Rp)"
            type="number"
            min="0"
            step="1000"
            required
            placeholder="0"
            value={newTrans.amount}
            onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
          />
          <Input
            label="Kategori"
            required
            placeholder="cth. Perawatan, Perlengkapan, Sewa"
            value={newTrans.category}
            onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
          />
          <Input
            label="Keterangan"
            required
            value={newTrans.description}
            onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })}
          />
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
