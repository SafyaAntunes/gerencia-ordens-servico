
import { OrdemServico, Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export type ServicoStatus = 
  | 'nao_iniciado'
  | 'em_andamento'
  | 'pausado'
  | 'concluido';
  
export type PausaRegistro = {
  inicio: number;
  fim?: number;
  motivo?: string;
};

export interface ServicoTrackerProps {
  servico: Servico;
  ordem?: OrdemServico;
  onUpdate?: (servico: Servico) => void;
  // Legacy props support
  ordemId?: string; 
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
}

export interface UseServicoTrackerProps extends ServicoTrackerProps {}

export interface ServicoTrackerState {
  isRunning: boolean;
  isPaused: boolean;
  time: string; // Modificado para string para consistência com displayTime
  concluido: boolean;
  status: ServicoStatus;
  pausas: PausaRegistro[];
  progressPercentage: number;
  tipoServico: TipoServico;
  completedSubatividades: number;
  totalSubatividades: number;
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  funcionariosOptions: Funcionario[];
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
  handleReiniciarServico: () => void;
  
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;

  state: ServicoTrackerState;
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
