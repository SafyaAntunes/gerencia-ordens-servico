
import { Servico, TipoServico, SubAtividade, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export type ServicoStatus = "nao_iniciado" | "em_andamento" | "pausado" | "concluido";

export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  temPermissao: boolean;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  subatividadesFiltradas: SubAtividade[];
  funcionariosOptions: Funcionario[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleMarcarConcluido: () => void;
  handleReiniciarServico: (e?: React.MouseEvent) => void;
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  handleStatusChange?: (newStatus: ServicoStatus) => void;
  setStatus?: (status: ServicoStatus) => void;
  state: {
    isRunning: boolean;
    isPaused: boolean;
    time: number;
    concluido: boolean;
    status: ServicoStatus;
    pausas: { inicio: number; fim?: number; motivo?: string }[];
    progressPercentage: number;
    tipoServico: TipoServico;
    completedSubatividades: number;
    totalSubatividades: number;
  };
  operations: {
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    complete: () => void;
    reset: () => void;
  };
  registerPausa: (motivo?: string) => void;
  finalizarPausa: () => void;
  handleAssign: (funcionarioId: string) => void;
}
