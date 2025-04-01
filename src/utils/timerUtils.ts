
import { EtapaOS, TipoServico } from "@/types/ordens";

// Format milliseconds as HH:MM:SS
export const formatTime = (ms: number): string => {
  if (!ms || isNaN(ms)) return "00:00:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const padZero = (n: number) => n.toString().padStart(2, '0');
  
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
};

// Generate a unique key for localStorage
export const generateTimerStorageKey = (
  ordemId: string, 
  etapa: string | EtapaOS, 
  tipoServico?: string | TipoServico
): string => {
  return tipoServico 
    ? `timer_${ordemId}_${etapa}_${tipoServico}` 
    : `timer_${ordemId}_${etapa}`;
};

// Calculate elapsed time based on start, pause, and total paused time
export const calculateElapsedTime = (
  startTime: number | null,
  isPaused: boolean,
  pauseTime: number | null,
  totalPausedTime: number
): number => {
  if (!startTime) return 0;
  
  const now = Date.now();
  let elapsed = now - startTime - totalPausedTime;
  
  if (isPaused && pauseTime) {
    elapsed = pauseTime - startTime - totalPausedTime;
  }
  
  return elapsed > 0 ? elapsed : 0;
};
