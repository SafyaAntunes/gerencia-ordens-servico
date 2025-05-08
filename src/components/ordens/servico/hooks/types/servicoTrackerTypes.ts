
import { Servico, SubAtividade, TipoServico } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export type ServicoStatus = "nao_iniciado" | "em_andamento" | "pausado" | "concluido";

export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
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
  progressPercentage: number; // Ensuring this is a number type
  completedSubatividades: number;
  totalSubatividades: number;
  tempoTotalEstimado: number;
  subatividadesFiltradas: SubAtividade[];
  pausas?: Array<{ inicio: number; fim?: number; motivo?: string }>;
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleStartClick: () => void;
  handlePause: (motivo?: string) => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleMarcarConcluido: () => void;
  handleReiniciarServico: () => void;
  // Novos campos para gerenciamento de responsável
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId?: string;
  lastSavedResponsavelNome?: string;
}
