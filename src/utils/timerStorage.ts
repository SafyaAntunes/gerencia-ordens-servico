
import { EtapaOS, TipoServico } from "@/types/ordens";
import { TimerState } from "@/types/timer";
import { generateTimerStorageKey } from "./timerUtils";

// Save timer state to localStorage
export const saveTimerData = (
  ordemId: string, 
  etapa: EtapaOS, 
  tipoServico: TipoServico | undefined, 
  state: TimerState
): void => {
  try {
    const key = generateTimerStorageKey(ordemId, etapa, tipoServico);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving timer data:", error);
  }
};

// Load timer state from localStorage
export const loadTimerData = (
  ordemId: string, 
  etapa: EtapaOS, 
  tipoServico?: TipoServico
): TimerState | null => {
  try {
    const key = generateTimerStorageKey(ordemId, etapa, tipoServico);
    const data = localStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data) as TimerState;
    }
    
    return null;
  } catch (error) {
    console.error("Error loading timer data:", error);
    return null;
  }
};

// Clear timer data from localStorage
export const clearTimerData = (
  ordemId: string, 
  etapa: EtapaOS, 
  tipoServico?: TipoServico
): void => {
  try {
    const key = generateTimerStorageKey(ordemId, etapa, tipoServico);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing timer data:", error);
  }
};
