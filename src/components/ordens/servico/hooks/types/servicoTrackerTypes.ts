
import { Servico, EtapaOS } from "@/types/ordens";
import { UseOrdemTimerResult } from "@/hooks/timer/types";

export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'pausado' | 'concluido';

export interface ServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoUpdate?: (servicoAtualizado: Servico) => void;
}

export interface ServicoTrackerHookResult {
  isShowingDetails: boolean;
  toggleDetails: () => void;
  handleSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  handleServicoConcluidoToggle: (checked: boolean) => void;
  handleSubatividadeSelecionadaToggle: (subatividadeId: string, checked: boolean) => void;
  temPermissao: boolean;
  timer: UseOrdemTimerResult;
}
