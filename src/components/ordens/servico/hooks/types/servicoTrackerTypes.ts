
import { OrdemServico, Servico } from "@/types/ordens";

export type ServicoStatus = 
  | 'nao_iniciado' 
  | 'em_andamento' 
  | 'pausado' 
  | 'concluido';

export interface ServicoTrackerData {
  isTimerRunning: boolean;
  timerDisplay: string;
  servicoStatus: ServicoStatus;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canComplete: boolean;
  startServico: () => Promise<void>;
  pauseServico: (motivo?: string) => Promise<void>;
  resumeServico: () => Promise<void>;
  completeServico: () => Promise<void>;
  atribuirFuncionario: (funcionarioId: string, funcionarioNome: string) => Promise<void>;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

export interface UseServicoTrackerProps {
  ordem: OrdemServico;
  servico: Servico;
  onUpdate?: (ordem: OrdemServico) => void;
}
