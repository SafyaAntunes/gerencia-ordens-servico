
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formats a date safely, handling invalid dates and returning a fallback string if the date is invalid
 * @param date Any date-like value to be formatted
 * @param formatStr Format string for date-fns
 * @param fallbackText Text to return if the date is invalid
 * @returns Formatted date string or fallback text
 */
export const formatDateSafely = (
  date: Date | string | number | null | undefined,
  formatStr: string = "dd/MM/yyyy",
  fallbackText: string = "Data não definida"
): string => {
  if (!date) return fallbackText;
  
  try {
    // Convert string dates to Date objects
    let dateObj: Date;
    if (typeof date === 'string') {
      try {
        // Try to parse as ISO date first
        dateObj = parseISO(date);
      } catch {
        // Fallback to standard Date constructor
        dateObj = new Date(date);
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Validate the date is valid before formatting
    if (!isValid(dateObj)) {
      console.warn("Data inválida:", date);
      return fallbackText;
    }
    
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error, date);
    return fallbackText;
  }
};

/**
 * Validates if a value is a valid date
 * @param date Any value to check if it's a valid date
 * @returns boolean indicating if the value is a valid date
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Safely converts a value to a Date object
 * @param date Any date-like value
 * @returns Date object or null if invalid
 */
export const toValidDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(dateObj) ? dateObj : null;
  } catch (error) {
    return null;
  }
};
