
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

// Definição de tipos para o estado do serviço
export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

// Props para o hook useServicoTracker
export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
}

// Estado do serviço
export interface ServicoTrackerState {
  isRunning: boolean;
  isPaused: boolean;
  time: number;
  concluido: boolean;
  status: ServicoStatus;
  pausas: { inicio: number; fim?: number }[];
  progressPercentage: number;
  tipoServico: TipoServico;
  completedSubatividades: number;
  totalSubatividades: number;
}

// Operações disponíveis
export interface ServicoTrackerOperations {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  reset: () => void;
}

// Resultado do hook useServicoTracker
export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  funcionariosOptions: Funcionario[];
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
  setResponsavelSelecionadoId: React.Dispatch<React.SetStateAction<string>>;
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
