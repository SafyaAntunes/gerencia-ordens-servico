
import { useState, useEffect } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { FormValues } from "../types";

interface UseOrdemFormDataProps {
  servicosTipos: string[];
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
}

export const useOrdemFormData = ({
  servicosTipos,
  defaultValues,
  defaultFotosEntrada = [],
  defaultFotosSaida = [],
}: UseOrdemFormDataProps) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>(
    defaultValues?.servicosDescricoes || {}
  );
  const [etapasTempoPreco, setEtapasTempoPreco] = useState<Record<string, any>>(
    defaultValues?.etapasTempoPreco || {}
  );
  const [fotosEntrada, setFotosEntrada] = useState<any[]>(defaultFotosEntrada);
  const [fotosSaida, setFotosSaida] = useState<any[]>(defaultFotosSaida);

  // Inicializa valores padrão
  useEffect(() => {
    if (defaultValues?.servicosDescricoes) {
      setServicosDescricoes(defaultValues.servicosDescricoes);
    }
    
    if (defaultValues?.etapasTempoPreco) {
      setEtapasTempoPreco(defaultValues.etapasTempoPreco);
    }
  }, [defaultValues]);

  // Limpar descrições de serviços que não estão mais selecionados
  useEffect(() => {
    if (servicosTipos.length > 0) {
      const descricoesFiltradas: Record<string, string> = {};
      for (const tipo of servicosTipos) {
        if (servicosDescricoes[tipo]) {
          descricoesFiltradas[tipo] = servicosDescricoes[tipo];
        } else {
          descricoesFiltradas[tipo] = "";
        }
      }
      setServicosDescricoes(descricoesFiltradas);
    }
  }, [servicosTipos]);

  // Handler para atualização de descrições de serviços
  const handleServicoDescricaoChange = (tipo: string, descricao: string) => {
    setServicosDescricoes((prev) => ({
      ...prev,
      [tipo]: descricao,
    }));
  };

  // Handler para atualização de tempo e preço
  const handleEtapaTempoPrecoChange = (etapa: string, dados: any) => {
    setEtapasTempoPreco((prev) => ({
      ...prev,
      [etapa]: dados,
    }));
  };

  return {
    servicosDescricoes,
    etapasTempoPreco,
    fotosEntrada,
    fotosSaida,
    setFotosEntrada,
    setFotosSaida,
    handleServicoDescricaoChange,
    handleEtapaTempoPrecoChange,
  };
};
