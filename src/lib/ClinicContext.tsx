"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Patient, Appointment, Transaction, PatientFile } from "@/types";

interface ClinicContextType {
  // Core data
  patients: Patient[];
  setPatients: (v: Patient[]) => void;
  appointments: Appointment[];
  setAppointments: (v: Appointment[]) => void;
  transactions: Transaction[];
  setTransactions: (v: Transaction[]) => void;
  // Files
  patientFiles: PatientFile[];
  setPatientFiles: (v: PatientFile[]) => void;
  // Logo (base64 string or null)
  logo: string | null;
  setLogo: (v: string | null) => void;
  // Hydration gate
  isHydrated: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients, h1] = useLocalStorage<Patient[]>("physiocare-patients", []);
  const [appointments, setAppointments, h2] = useLocalStorage<Appointment[]>("physiocare-appointments", []);
  const [transactions, setTransactions, h3] = useLocalStorage<Transaction[]>("physiocare-transactions", []);
  const [patientFiles, setPatientFiles, h4] = useLocalStorage<PatientFile[]>("physiocare-patient-files", []);
  const [logo, setLogo, h5] = useLocalStorage<string | null>("physiocare-logo", null);

  const isHydrated = h1 && h2 && h3 && h4 && h5;

  return (
    <ClinicContext.Provider value={{
      patients, setPatients,
      appointments, setAppointments,
      transactions, setTransactions,
      patientFiles, setPatientFiles,
      logo, setLogo,
      isHydrated,
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used within ClinicProvider");
  return ctx;
}
