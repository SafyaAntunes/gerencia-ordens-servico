
import { SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { FormValues } from "../../types";

export interface UseOrdemFormDataProps {
  servicosTipos: string[];
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
}

export interface UseOrdemFormDataReturn {
  servicosDescricoes: Record<string, string>;
  servicosSubatividades: Record<string, SubAtividade[]>;
  loadingSources: Record<string, string>;
  fotosEntrada: File[];
  fotosSaida: File[];
  etapasTempoPreco: Record<string, { precoHora?: number; tempoEstimado?: number }>;
  setFotosEntrada: (fotos: File[]) => void;
  setFotosSaida: (fotos: File[]) => void;
  handleServicoDescricaoChange: (tipo: string, descricao: string) => void;
  handleSubatividadesChange: (tipo: TipoServico, subatividades: SubAtividade[]) => void;
  handleEtapaTempoPrecoChange: (etapa: EtapaOS, field: 'precoHora' | 'tempoEstimado', value: number) => void;
}
