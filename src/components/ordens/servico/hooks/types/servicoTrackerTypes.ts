
import { OrdemServico, Servico, SubAtividade, EtapaOS, PausaRegistro } from "@/types/ordens";

export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

export interface UseServicoTrackerProps {
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
  canAddSubatividades?: boolean; // Nova propriedade para controlar adição de subatividades
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
  state: {
    isRunning: boolean;
    isPaused: boolean;
    time: string;
    concluido: boolean;
    status: ServicoStatus;
    pausas: PausaRegistro[];
    progressPercentage: number;
    tipoServico: string;
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
  addSubatividade?: (subatividade: SubAtividade) => void; // Novo método para adicionar subatividade
}

export interface ServicoTrackerProps extends UseServicoTrackerProps {
  // Quaisquer props adicionais específicas do componente
}
