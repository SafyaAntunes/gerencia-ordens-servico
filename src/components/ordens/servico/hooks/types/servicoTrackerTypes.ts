
import { OrdemServico, Servico, TipoServico, EtapaOS } from "@/types/ordens";

export interface ServicoTrackerProps {
  servico: Servico;
  ordem: OrdemServico;
  onUpdate?: (ordem: OrdemServico) => void;
  // Legacy props support
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: EtapaOS;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  canAddSubatividades?: boolean;
}

export type ServicoStatus = "pendente" | "em_andamento" | "pausado" | "concluido";

export interface PausaRegistro {
  inicio: number;
  fim?: number;
  motivo?: string;
}

export type TimerStatus = "stopped" | "running" | "paused";
