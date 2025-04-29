
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
  if (!ordemId || !etapa) {
    console.error("Missing required parameters for saveTimerData", {ordemId, etapa});
    return;
  }
  
  try {
    const key = generateTimerStorageKey(ordemId, etapa, tipoServico);
    console.log("Saving timer data with key:", key, state);
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
  if (!ordemId || !etapa) {
    console.error("Missing required parameters for loadTimerData", {ordemId, etapa});
    return null;
  }
  
  try {
    const key = generateTimerStorageKey(ordemId, etapa, tipoServico);
    const data = localStorage.getItem(key);
    console.log("Loading timer data with key:", key, data ? "data found" : "no data");
    
    if (data) {
      try {
        return JSON.parse(data) as TimerState;
      } catch (e) {
        console.error("Error parsing timer data:", e);
        return null;
      }
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
  if (!ordemId || !etapa) {
    console.error("Missing required parameters for clearTimerData", {ordemId, etapa});
    return;
  }
  
  try {
    const key = generateTimerStorageKey(ordemId, etapa, tipoServico);
    console.log("Clearing timer data with key:", key);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing timer data:", error);
  }
};
