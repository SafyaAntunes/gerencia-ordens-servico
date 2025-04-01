
import { TimerState } from "@/types/timer";
import { generateTimerStorageKey } from "./timerUtils";
import { EtapaOS, TipoServico } from "@/types/ordens";

/**
 * Load timer data from localStorage
 */
export const loadTimerData = (
  ordemId: string,
  etapa: EtapaOS,
  tipoServico?: TipoServico
): TimerState | null => {
  const storageKey = generateTimerStorageKey(ordemId, etapa, tipoServico);
  const savedData = localStorage.getItem(storageKey);
  
  if (!savedData) return null;
  
  try {
    return JSON.parse(savedData) as TimerState;
  } catch (error) {
    console.error("Erro ao carregar dados do cronômetro:", error);
    return null;
  }
};

/**
 * Save timer data to localStorage
 */
export const saveTimerData = (
  ordemId: string,
  etapa: EtapaOS,
  tipoServico: TipoServico | undefined,
  timerState: TimerState
): void => {
  const storageKey = generateTimerStorageKey(ordemId, etapa, tipoServico);
  localStorage.setItem(storageKey, JSON.stringify(timerState));
};
