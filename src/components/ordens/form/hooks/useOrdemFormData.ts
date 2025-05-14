
import { useState, useEffect, useCallback } from "react";
import { SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { FormValues } from "../types";
import { useServicosState } from "./useServicosState";
import { useFotosHandler } from "./useFotosHandler";
import { useEtapasConfig } from "./useEtapasConfig";

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

export const useOrdemFormData = ({
  servicosTipos,
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
}: UseOrdemFormDataProps): UseOrdemFormDataReturn => {
  // Use the existing hooks for servicos, fotos, and etapas
  const {
    servicosDescricoes,
    servicosSubatividades,
    loadingSources,
    handleServicoDescricaoChange,
    handleSubatividadesChange,
  } = useServicosState(servicosTipos, defaultValues);
  
  const {
    fotosEntrada,
    fotosSaida,
    setFotosEntrada,
    setFotosSaida,
  } = useFotosHandler(defaultFotosEntrada, defaultFotosSaida);
  
  const {
    etapasTempoPreco,
    handleEtapaTempoPrecoChange,
  } = useEtapasConfig(defaultValues?.etapasTempoPreco);
  
  // Return all the data and handlers
  return {
    servicosDescricoes,
    servicosSubatividades,
    loadingSources,
    fotosEntrada,
    fotosSaida,
    etapasTempoPreco,
    setFotosEntrada,
    setFotosSaida,
    handleServicoDescricaoChange,
    handleSubatividadesChange,
    handleEtapaTempoPrecoChange,
  };
};
