
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

export interface UseServicoTimerResult {
  isRunning: boolean;
  isPaused: boolean;
  displayTime: string;
  elapsedSeconds: number;
  startTime: number | null;
  pauseTime: number | null;
  pausas: { inicio: number; fim?: number }[];
  handleStartClick: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleFinish: () => void;
}

export interface ServicoTrackerState {
  isRunning: boolean;
  isPaused: boolean;
  time: number;
  concluido: boolean;
  status: ServicoStatus;
  pausas: { inicio: number; fim?: number }[];
  tipoServico: TipoServico;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
}

export interface ServicoTrackerOperations {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  reset: () => void;
}

export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  temPermissao: boolean;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  subatividadesFiltradas: SubAtividade[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleMarcarConcluido: () => void;
  funcionariosOptions: Funcionario[];
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  handleStatusChange: (newStatus: ServicoStatus) => void;
  setStatus: React.Dispatch<React.SetStateAction<ServicoStatus>>;
  handleReiniciarServico: () => void;
  state: ServicoTrackerState;
  operations: ServicoTrackerOperations;
  registerPausa: () => void;
  finalizarPausa: () => void;
  handleAssign: () => void;
}
