
import { Servico, SubAtividade, TipoServico, ServicoStatus, EtapaOS } from "@/types/ordens";

export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}

export interface ServicoState {
  isRunning: boolean;
  isPaused: boolean;
  time: number;
  concluido: boolean;
  status: ServicoStatus;
  pausas: any[];
  progressPercentage: number;
  tipoServico: TipoServico;
  completedSubatividades: number;
  totalSubatividades: number;
}

export interface ServicoOperations {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  reset: () => void;
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  funcionariosOptions: any[];
  temPermissao: boolean;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  subatividadesFiltradas: SubAtividade[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleMarcarConcluido: () => void;
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  handleStatusChange: (status: ServicoStatus) => void;
  setStatus: (status: ServicoStatus) => void;
  state: ServicoState;
  operations: ServicoOperations;
  // Legacy methods
  handleReiniciarServico: () => void;
  registerPausa: () => void;
  finalizarPausa: () => void;
  handleAssign: () => void;
}

// Re-export for easier imports
export type { ServicoStatus } from '@/types/ordens';
