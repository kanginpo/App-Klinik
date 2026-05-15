"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Patient, Appointment, Transaction } from '@/types';

interface ClinicContextType {
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useLocalStorage<Patient[]>('physiocare-patients', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('physiocare-appointments', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('physiocare-transactions', []);

  return (
    <ClinicContext.Provider value={{
      patients,
      setPatients,
      appointments,
      setAppointments,
      transactions,
      setTransactions
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
