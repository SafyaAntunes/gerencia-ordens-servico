
import { Servico, EtapaOS, TipoServico, SubAtividade, OrdemServico } from "@/types/ordens";

export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

export type PausaRegistro = {
  inicio: number;
  fim?: number;
  motivo?: string;
};

export interface ServicoTrackerProps {
  servico: Servico;
  ordem: OrdemServico;
  onUpdate?: (ordemAtualizada: OrdemServico) => void;
  // Legacy props
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  canAddSubatividades?: boolean;
}

// Alias for backward compatibility
export type UseServicoTrackerProps = ServicoTrackerProps;

export interface ServicoTrackerState {
  isRunning: boolean;
  isPaused: boolean;
  time: string;
  concluido: boolean;
  status: ServicoStatus;
  pausas: PausaRegistro[];
  progressPercentage: number;
  tipoServico: TipoServico;
  completedSubatividades: number;
  totalSubatividades: number;
}

export interface ServicoTrackerOperations {
  start: () => void;
  pause: (motivo?: string) => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  reset: () => void;
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  subatividadesFiltradas: SubAtividade[];
  pausas: PausaRegistro[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleStartClick: () => void;
  handlePause: (motivo?: string) => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleMarcarConcluido: () => void;
  // Additional operations 
  handleReiniciarServico: () => void;
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: React.Dispatch<React.SetStateAction<string>>;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  state: ServicoTrackerState;
  operations: ServicoTrackerOperations;
  registerPausa: (motivo?: string) => void;
  finalizarPausa: () => void;
  handleAssign: () => void;
}
