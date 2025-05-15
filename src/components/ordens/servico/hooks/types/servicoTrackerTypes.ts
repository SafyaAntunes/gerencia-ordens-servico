
import { Funcionario } from "@/types/funcionarios";
import { Servico, TipoServico } from "@/types/ordens";
import { Dispatch, SetStateAction } from "react";

export interface PausaRegistro {
  iniciado: number;
  finalizado?: number;
  motivo?: string;
}

export type ServicoStatus = 
  | "nao_iniciado"
  | "em_andamento"
  | "pausado"
  | "concluido";

export interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
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

export interface ServicoOperations {
  start: () => void;
  pause: (motivo?: string) => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  reset: () => void;
}

export interface UseServicoTrackerResult {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  funcionariosOptions: Funcionario[];
  temPermissao: boolean;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  subatividadesFiltradas: any[];
  pausas?: PausaRegistro[];
  handleLoadFuncionarios: () => Promise<void>;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleMarcarConcluido: () => void;
  handleReiniciarServico: () => void;
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
  state: ServicoState;
  operations: ServicoOperations;
  registerPausa: (motivo?: string) => void;
  finalizarPausa: () => void;
  handleAssign: () => void;
}
