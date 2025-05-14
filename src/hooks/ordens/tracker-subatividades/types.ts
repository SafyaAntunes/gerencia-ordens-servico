
import { SubAtividade, TipoServico, EtapaOS, OrdemServico } from "@/types/ordens";

export interface SubatividadeToggleParams {
  servicoTipo: TipoServico;
  subatividadeId: string;
  checked: boolean;
}

export interface TrackerSubatividadesProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export interface TrackerResponse {
  success: boolean;
  message: string;
}

export interface EtapaStatusUpdateParams {
  etapa: EtapaOS;
  concluida: boolean;
  funcionarioId?: string;
  funcionarioNome?: string;
  servicoTipo?: TipoServico;
}
