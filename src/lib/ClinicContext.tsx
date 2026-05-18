"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Patient, Appointment, Transaction } from "@/types";

interface ClinicContextType {
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  isHydrated: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients, pHydrated] = useLocalStorage<Patient[]>(
    "physiocare-patients",
    []
  );
  const [appointments, setAppointments, aHydrated] =
    useLocalStorage<Appointment[]>("physiocare-appointments", []);
  const [transactions, setTransactions, tHydrated] =
    useLocalStorage<Transaction[]>("physiocare-transactions", []);

  const isHydrated = pHydrated && aHydrated && tHydrated;

  return (
    <ClinicContext.Provider
      value={{
        patients,
        setPatients,
        appointments,
        setAppointments,
        transactions,
        setTransactions,
        isHydrated,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error("useClinic must be used within a ClinicProvider");
  }
  return context;
}
