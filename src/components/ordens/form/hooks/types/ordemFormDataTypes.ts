
import { SubAtividade, TipoServico, EtapaOS, TipoAtividade } from "@/types/ordens";
import { FormValues } from "../../types";

export interface OrdemFormDataState {
  servicosDescricoes: Record<string, string>;
  servicosSubatividades: Record<string, SubAtividade[]>;
  fotosEntrada: File[];
  fotosSaida: File[];
  etapasConfig: Record<TipoAtividade, SubAtividade[]>;
  isLoadingEtapas: boolean;
  etapasTempoPreco: Record<string, {precoHora?: number, tempoEstimado?: number}>;
}

export interface OrdemFormDataHandlers {
  setFotosEntrada: (fotos: File[]) => void;
  setFotosSaida: (fotos: File[]) => void;
  handleServicoDescricaoChange: (tipo: string, descricao: string) => void;
  handleSubatividadesChange: (tipo: TipoServico, subatividades: SubAtividade[]) => void;
  handleEtapaTempoPrecoChange: (etapa: EtapaOS, field: 'precoHora' | 'tempoEstimado', value: number) => void;
}

export interface UseOrdemFormDataProps {
  servicosTipos: string[];
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
}

export type UseOrdemFormDataReturn = OrdemFormDataState & OrdemFormDataHandlers;
