
import { EtapaOS, TipoServico } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";

export interface EtapaStatus {
  concluido?: boolean;
  iniciado?: Date;
  finalizado?: Date;
  usarCronometro?: boolean;
  pausas?: { inicio: number; fim?: number; motivo?: string }[];
  funcionarioId?: string;
  funcionarioNome?: string;
  servicoTipo?: TipoServico;
}

export interface UseEtapaCardProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
}

export interface UseEtapaCardResult {
  isAtivo: boolean;
  setIsAtivo: (value: boolean) => void;
  progresso: number;
  setProgresso: (value: number) => void;
  funcionariosOptions: Funcionario[];
  podeAtribuirFuncionario: boolean;
  podeTrabalharNaEtapa: () => boolean;
  podeReabrirAtividade: () => boolean;
  handleIniciarTimer: () => boolean;
  handleTimerStart: () => boolean;
  handleMarcarConcluido: () => boolean;
  isEtapaConcluida: (etapaInfo: any) => boolean;
  getEtapaStatus: (etapaInfo: any) => "concluido" | "em_andamento" | "nao_iniciado";
  handleReiniciarEtapa: (onEtapaStatusChange: any) => void;
  atribuirFuncionarioDialogOpen: boolean;
  setAtribuirFuncionarioDialogOpen: (value: boolean) => void;
  dialogAction: 'start' | 'finish';
  setDialogAction: (value: 'start' | 'finish') => void;
  funcionarioSelecionadoId: string;
  funcionarioSelecionadoNome: string;
  handleFuncionarioChange: (value: string) => void;
  handleConfirmarAtribuicao: (onEtapaStatusChange?: any) => void;
}
