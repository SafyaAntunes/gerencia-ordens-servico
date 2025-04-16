
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

// Safe date formatter that ensures input is a valid Date object
export function formatDate(date: Date | null | undefined, locale = 'pt-BR'): string {
  if (!date) return '-';
  
  // Ensure date is a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '-';
  
  return dateObj.toLocaleDateString(locale);
}

// Safe date and time formatter
export function formatDateTime(date: Date | null | undefined, locale = 'pt-BR'): string {
  if (!date) return '-';
  
  // Ensure date is a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '-';
  
  return `${dateObj.toLocaleDateString(locale)} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
}
