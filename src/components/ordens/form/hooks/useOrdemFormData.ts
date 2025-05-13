
import { useMemo } from "react";
import { UseOrdemFormDataProps, UseOrdemFormDataReturn } from "./types/ordemFormDataTypes";
import { useFotosHandler } from "./useFotosHandler";
import { useEtapasConfig } from "./useEtapasConfig";
import { useServicosState } from "./useServicosState";

export const useOrdemFormData = ({
  servicosTipos,
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = []
}: UseOrdemFormDataProps): UseOrdemFormDataReturn => {
  // Handlers for fotos
  const { 
    fotosEntrada, 
    fotosSaida, 
    setFotosEntrada, 
    setFotosSaida 
  } = useFotosHandler(defaultFotosEntrada, defaultFotosSaida);

  // Handlers for etapas config and tempo/preco
  const { 
    etapasConfig, 
    isLoadingEtapas, 
    etapasTempoPreco, 
    handleEtapaTempoPrecoChange 
  } = useEtapasConfig(defaultValues?.etapasTempoPreco);

  // Handlers for servicos state
  const {
    servicosDescricoes,
    servicosSubatividades,
    handleServicoDescricaoChange,
    handleSubatividadesChange
  } = useServicosState(servicosTipos, defaultValues);

  // Use memoized values for outputs that don't need to change on every render
  const memoizedState = useMemo(() => ({
    servicosDescricoes,
    servicosSubatividades, 
    fotosEntrada,
    fotosSaida,
    etapasConfig,
    isLoadingEtapas,
    etapasTempoPreco,
  }), [
    servicosDescricoes,
    servicosSubatividades,
    fotosEntrada, 
    fotosSaida,
    etapasConfig,
    isLoadingEtapas,
    etapasTempoPreco
  ]);

  return {
    ...memoizedState,
    setFotosEntrada,
    setFotosSaida,
    handleServicoDescricaoChange,
    handleSubatividadesChange,
    handleEtapaTempoPrecoChange
  };
};
