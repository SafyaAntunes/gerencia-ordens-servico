
import { useState } from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";

export function useEtapaStatusHandlers(etapa: EtapaOS, servicoTipo?: TipoServico) {
  const [isAtivo, setIsAtivo] = useState(false);
  
  const isEtapaConcluida = (etapaInfo: any) => {
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    return etapaInfo?.concluido;
  };
  
  const getEtapaStatus = (etapaInfo: any) => {
    if (isEtapaConcluida(etapaInfo)) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  return {
    isAtivo,
    setIsAtivo,
    isEtapaConcluida,
    getEtapaStatus
  };
}
