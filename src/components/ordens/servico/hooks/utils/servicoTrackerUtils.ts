
import { ServicoStatus } from "../types/servicoTrackerTypes";

export const getServicoStatus = (
  isRunning: boolean, 
  isPaused: boolean, 
  concluido: boolean
): ServicoStatus => {
  if (concluido) return "concluido";
  if (isRunning && !isPaused) return "em_andamento";
  if (isPaused) return "pausado";
  return "nao_iniciado";
};

export const formatTimeDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return [hours, minutes, remainingSeconds]
    .map(val => val.toString().padStart(2, "0"))
    .join(":");
};
