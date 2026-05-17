import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date) {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return String(date);
    return format(d, "PPP");
  } catch {
    return String(date);
  }
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}
