
import { ServicoStatus } from "@/types/ordens";

export const getServicoStatus = (
  concluido: boolean, 
  emAndamento: boolean = false, 
  pausado: boolean = false
): ServicoStatus => {
  if (concluido) return "concluido";
  if (pausado) return "pausado";
  if (emAndamento) return "em_andamento";
  return "nao_iniciado";
};

// Format seconds to hh:mm:ss display
export const formatTimeDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = secs.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};
