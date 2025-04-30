
import { Funcionario } from "@/types/funcionarios";
import { EtapaOS, TipoServico } from "@/types/ordens";

export interface UseEtapaCardProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
}

export interface UseEtapaCardResult {
  isAtivo: boolean;
  setIsAtivo: (isAtivo: boolean) => void;
  progresso?: number;
  setProgresso?: (progresso: number) => void;
  funcionariosOptions: Funcionario[];
  podeAtribuirFuncionario: boolean;
  podeTrabalharNaEtapa: () => boolean;
  podeReabrirAtividade: () => boolean;
  handleIniciarTimer: () => boolean;
  handleTimerStart: () => boolean;
  handleMarcarConcluido: (servicos?: any[]) => boolean;
  isEtapaConcluida: (etapaInfo?: any) => boolean;
  getEtapaStatus: (etapaInfo?: any) => 'concluido' | 'em_andamento' | 'nao_iniciado';
  handleReiniciarEtapa: (onEtapaStatusChange: any) => void;
  atribuirFuncionarioDialogOpen: boolean;
  setAtribuirFuncionarioDialogOpen: (open: boolean) => void;
  dialogAction: 'start' | 'finish';
  setDialogAction: (action: 'start' | 'finish') => void;
  funcionarioSelecionadoId: string;
  funcionarioSelecionadoNome: string;
  handleFuncionarioChange: (value: string) => void;
  handleConfirmarAtribuicao: (onEtapaStatusChange?: any) => void;
}
