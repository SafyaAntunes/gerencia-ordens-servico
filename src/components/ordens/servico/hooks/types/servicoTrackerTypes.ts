
export type ServicoStatus = 'pending' | 'in-progress' | 'completed';

export type ServicoStatusType = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'pausado';

export interface ServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoUpdate?: (servico: Servico) => void;
}
