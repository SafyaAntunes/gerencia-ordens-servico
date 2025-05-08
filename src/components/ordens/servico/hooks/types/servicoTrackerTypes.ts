
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

export interface PausaRegistro {
  iniciado: number;
  finalizado?: number;
  motivo?: string;
}

export interface ServicoState {
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
  setIsOpen: (open: boolean) => void;
  funcionariosOptions: Funcionario[];
  temPermissao: boolean;
  isRunning: boolean;
  isPaused: boolean;
  displayTime: number;  // Changed from string to number to match useOrdemTimer
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
  state: ServicoState;
  operations: {
    start: () => void;
    pause: (motivo?: string) => void;
    resume: () => void;
    stop: () => void;
    complete: () => void;
    reset: () => void;
  };
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  registerPausa: (motivo?: string) => void;
  finalizarPausa: () => void;
  handleAssign: () => void;
}
