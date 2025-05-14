
import { ServicoStatus } from "../types/servicoTrackerTypes";

// Get status based on running, paused, and completed states
export const getServicoStatus = (isRunning: boolean, isPaused: boolean, concluido: boolean): ServicoStatus => {
  if (concluido) {
    return "concluido";
  } else if (isRunning) {
    if (isPaused) {
      return "pausado";
    }
    return "em_andamento";
  } else {
    return "nao_iniciado";
  }
};

// Format display time for timer
export const formatTimeDisplay = (seconds: number): string => {
  if (seconds < 0) return "00:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [hours, minutes, secs]
    .map(unit => String(unit).padStart(2, '0'))
    .join(':');
};
