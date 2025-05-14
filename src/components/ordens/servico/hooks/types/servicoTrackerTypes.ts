
import { OrdemServico, Servico, EtapaOS, TipoServico } from "@/types/ordens";

export type ServicoStatus = 
  | 'nao_iniciado' 
  | 'em_andamento' 
  | 'pausado' 
  | 'concluido';

export interface ServicoTrackerProps {
  servico: Servico;
  ordem: OrdemServico;
  onUpdate?: (ordem: OrdemServico) => void;
  // Legacy props (to be used during transition to new API)
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
}

export interface PausaRegistro {
  inicio: number;
  fim?: number;
  motivo?: string;
  // Aliases for backward compatibility
  iniciado?: number;
  finalizado?: number;
}

export interface UseServicoTrackerResult {
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
  pausas: PausaRegistro[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleStartClick: () => void;
  handlePause: (motivo?: string) => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleMarcarConcluido: () => void;
  handleReiniciarServico: () => void;
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  state: {
    isRunning: boolean;
    isPaused: boolean;
    time: string; // Changed from number to string to fix type inconsistency
    concluido: boolean;
    status: ServicoStatus;
    pausas: PausaRegistro[];
    progressPercentage: number;
    tipoServico: TipoServico;
    completedSubatividades: number;
    totalSubatividades: number;
  };
  operations: {
    start: () => void;
    pause: (motivo?: string) => void;
    resume: () => void;
    stop: () => void;
    complete: () => void;
    reset: () => void;
  };
  registerPausa: (motivo?: string) => void;
  finalizarPausa: () => void;
  handleAssign: () => void;
}

export interface UseServicoTrackerProps extends ServicoTrackerProps {
  // Any additional props specific to the hook
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
}
