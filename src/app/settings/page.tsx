"use client";

import React, { useState } from "react";
import { Trash2, Download, Upload, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useClinic } from "@/lib/ClinicContext";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { patients, appointments, transactions, setPatients, setAppointments, setTransactions } =
    useClinic();
  const [showClearModal, setShowClearModal] = useState(false);

  const exportData = () => {
    const data = { patients, appointments, transactions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `physiocare-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
        if (data.patients) setPatients(data.patients);
        if (data.appointments) setAppointments(data.appointments);
        if (data.transactions) setTransactions(data.transactions);
        alert("Data imported successfully!");
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearAll = () => {
    setPatients([]);
    setAppointments([]);
    setTransactions([]);
    setShowClearModal(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your clinic data</p>
      </div>

      {/* Data summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Patients", value: patients.length },
              { label: "Appointments", value: appointments.length },
              { label: "Transactions", value: transactions.length },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            All data is stored locally in your browser. It does not leave your device.
          </p>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Export your data as a JSON file for backup, or import a previous backup to restore.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-1.5" />
              Export Backup
            </Button>
            <label>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-1.5" />
                Import Backup
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={importData}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Permanently delete all clinic data from this device. This cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setShowClearModal(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Confirm clear modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Data"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Are you absolutely sure?</p>
            <p className="text-sm text-gray-500 mt-1">
              This will permanently delete {patients.length} patients,{" "}
              {appointments.length} appointments, and {transactions.length} transactions.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={clearAll}>
              Yes, Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
