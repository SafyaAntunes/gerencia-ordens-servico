
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

// Format time as hours, minutes, seconds
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Format duration in a human readable format (e.g. 2h 30min)
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`;
  } else {
    return `${minutes}min`;
  }
}
