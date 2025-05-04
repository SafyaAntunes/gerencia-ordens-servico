import { Servico, SubAtividade } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export type ServicoStatus = "pendente" | "em_andamento" | "pausado" | "concluido" | "desabilitado";

export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}

export interface ServicoState {
  isOpen: boolean;
  isRunning: boolean;
  isPaused: boolean;
  displayTime: string;
  elapsedSeconds: number;
  startTime: number | null;
  pauseTime: number | null;
  pausas: {inicio: number; fim?: number; motivo?: string}[];
  funcionariosOptions: Funcionario[];
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  funcionariosOptions: Funcionario[];
  temPermissao: boolean;
  isRunning: boolean;
  isPaused: boolean;
  displayTime: number;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  tempoTotalEstimado: number;
  subatividadesFiltradas: SubAtividade[];
  pausas: {inicio: number; fim?: number; motivo?: string}[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleStartClick: () => void;
  handlePause: (motivo?: string) => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleMarcarConcluido: () => void;
  handleReiniciarServico: () => void;
}
