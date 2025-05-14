
import { useState } from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { gerarEtapaKey, verificarEtapaConcluida, obterEtapaStatus } from "@/hooks/ordens/tracker-subatividades/utils";

export function useEtapaStatusHandlers(etapa: EtapaOS, servicoTipo?: TipoServico) {
  const [isAtivo, setIsAtivo] = useState(false);
  
  // Utiliza as funções padronizadas para verificar se a etapa está concluída
  const isEtapaConcluida = (etapaInfo: any) => {
    if (!etapaInfo) return false;
    
    // Se for inspeção e tiver tipo de serviço, verifica se esse tipo específico está concluído
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    
    return etapaInfo?.concluido === true;
  };
  
  // Utiliza as funções padronizadas para obter o status da etapa
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
