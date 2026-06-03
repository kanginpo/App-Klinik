export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  treatmentType: string;
  notes?: string;
  price: number;
}

export type TransactionType = 'revenue' | 'cost';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  appointmentId?: string;
}

export interface PatientFile {
  id: string;
  patientId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  data: string; // base64
  uploadedAt: string;
}

export interface ClinicStats {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  patientCount: number;
  appointmentCount: number;
}
// ─── Tambahkan ini ke src/types/index.ts ─────────────────────────────────────
 
export interface InvoiceItem {
  id: string;
  description: string;
  price: number;
  qty: number;
}
 
export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  patientId: string;       // relasi ke Patient.id
  patientName: string;     // snapshot nama saat invoice dibuat
  phone: string;
  address: string;
  notes: string;
  items: InvoiceItem[];
  discount: number;
  subtotal: number;
  total: number;
  isPaid: boolean;
  createdAt: string;
}
 
