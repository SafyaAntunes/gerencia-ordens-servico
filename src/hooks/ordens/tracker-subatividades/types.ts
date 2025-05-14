
import { SubAtividade, TipoServico, OrdemServico } from '@/types/ordens';

export interface UseTrackerSubatividadesProps {
  ordem?: OrdemServico;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export interface UseTrackerSubatividadesResult {
  isAddingSubatividades: boolean;
  addSelectedSubatividades: (servicoTipo: TipoServico, subatividadesNomes: string[]) => Promise<OrdemServico | void>;
  addCustomSubatividade: (servicoTipo: TipoServico, nome: string, tempoEstimado?: number) => Promise<SubAtividade | void>;
}
