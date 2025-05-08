
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
  
  // Additional properties used in ServicoTracker component
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  funcionariosOptions: any[];
  temPermissao: boolean;
  isRunning: boolean;
  isPaused: boolean;
  displayTime: string;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  tempoTotalEstimado: number;
  subatividadesFiltradas: any[];
  handleLoadFuncionarios: () => void;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleStartClick: () => void;
  handlePause: (motivo?: string) => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleMarcarConcluido: () => void;
  handleReiniciarServico: () => void;
  pausas: PausaRegistro[];
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
}

export interface UseServicoTrackerProps {
  servico: any;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}
