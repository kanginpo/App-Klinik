"use client";

import React, { useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Transaction } from "@/types";
import { generateId, formatCurrency, formatDate, cn } from "@/lib/utils";
import { useClinic } from "@/lib/ClinicContext";

type FilterType = "all" | "revenue" | "cost";

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
    if (confirm("Remove this transaction?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Description", "Category", "Type", "Amount"],
      ...transactions.map((t) => [
        formatDate(t.date),
        t.description,
        t.category,
        t.type,
        t.amount.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track revenue and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  Revenue
                </p>
                <p className="text-2xl font-bold text-green-900 mt-0.5">
                  {formatCurrency(totals.revenue)}
                </p>
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
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                  Expenses
                </p>
                <p className="text-2xl font-bold text-red-900 mt-0.5">
                  {formatCurrency(totals.cost)}
                </p>
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
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Net Income
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-0.5">
                  {formatCurrency(totals.revenue - totals.cost)}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          {/* Filter tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {(["all", "revenue", "cost"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                  filter === f
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                        {t.description}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {t.category}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-6 py-3 font-bold text-right whitespace-nowrap",
                          t.type === "revenue"
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {t.type === "revenue" ? "+" : "−"}
                        {formatCurrency(t.amount)}
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

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Transaction"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            {(["revenue", "cost"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={cn(
                  "py-2 text-sm font-medium rounded-lg transition-colors capitalize",
                  newTrans.type === t
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setNewTrans({ ...newTrans, type: t })}
              >
                {t === "revenue" ? "Revenue" : "Expense"}
              </button>
            ))}
          </div>

          <Input
            label="Amount (USD)"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            value={newTrans.amount}
            onChange={(e) =>
              setNewTrans({ ...newTrans, amount: e.target.value })
            }
          />
          <Input
            label="Category"
            required
            placeholder="e.g. Treatment, Supplies, Rent"
            value={newTrans.category}
            onChange={(e) =>
              setNewTrans({ ...newTrans, category: e.target.value })
            }
          />
          <Input
            label="Description"
            required
            value={newTrans.description}
            onChange={(e) =>
              setNewTrans({ ...newTrans, description: e.target.value })
            }
          />
          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
