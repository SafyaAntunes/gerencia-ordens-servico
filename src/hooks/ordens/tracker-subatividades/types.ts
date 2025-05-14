
import { OrdemServico, TipoServico } from "@/types/ordens";

export interface UseTrackerSubatividadesProps {
  ordem?: OrdemServico;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export interface UseTrackerSubatividadesResult {
  isAddingSubatividades: boolean;
  addSelectedSubatividades: (servicoTipo: TipoServico, subatividadesIds: string[]) => Promise<void>;
  addCustomSubatividade: (servicoTipo: TipoServico, nome: string, tempoEstimado?: number) => Promise<void>;
}
