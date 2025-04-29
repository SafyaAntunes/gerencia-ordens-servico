
import { SubAtividade } from "@/types/ordens";
import { ServicoStatus } from "../types/servicoTrackerTypes";

// Format time for display
export function formatTimeDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Calculate the service status based on current state
export function calculateServicoStatus(
  concluido: boolean,
  isPaused: boolean,
  isRunning: boolean,
  subatividades?: SubAtividade[]
): ServicoStatus {
  if (concluido) return "concluido";
  if (isPaused) return "pausado";
  if (isRunning) return "em_andamento";
  if (subatividades?.some(s => s.concluida)) return "em_andamento";
  return "pendente";
}

// Filter and compute subatividade-related metrics
export function computeSubatividadeMetrics(subatividades?: SubAtividade[]) {
  const filtradas = subatividades?.filter(s => s.selecionada) || [];
  const completedCount = filtradas.filter(s => s.concluida).length;
  const totalCount = filtradas.length;
  const tempoTotalEstimado = filtradas.reduce((acc, curr) => acc + (curr.tempoEstimado || 0), 0);
  
  const progressPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  
  return {
    filtradas,
    completedCount,
    totalCount,
    tempoTotalEstimado,
    progressPercentage
  };
}
