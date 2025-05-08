
import { TipoServico } from "@/types/ordens";

export type ServicoStatus = "concluido" | "em_andamento" | "pausado" | "nao_iniciado";

export interface PausaRegistro {
  iniciado: Date;
  finalizado?: Date;
  duracao?: number; // em segundos
  motivo?: string;
}

export interface ServicoTrackerState {
  isRunning: boolean;
  isPaused: boolean;
  time: number;
  concluido: boolean;
  status: ServicoStatus;
  pausas: PausaRegistro[];
  progressPercentage: number;
  tipoServico: TipoServico;
  completedSubatividades: number;
  totalSubatividades: number;
}

export interface TimerOperations {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  reset: () => void;
}

export interface ServicoTrackerProps {
  servicoId: string;
  tipoServico: TipoServico;
  ordemId: string;
  defaultTime?: number;
  isConcluido?: boolean;
  funcionarioId?: string;
  pausas?: PausaRegistro[];
  iniciado?: Date | null;
  finalizado?: Date | null;
  onStatusChange?: (status: ServicoStatus) => void;
}

export interface UseServicoTrackerResult {
  state: ServicoTrackerState;
  operations: TimerOperations;
  registerPausa: (motivo?: string) => void;
  finalizarPausa: () => void;
  handleAssign: (funcionarioId: string) => void;
}
