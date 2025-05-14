
import { useState } from "react";
import { OrdemServico, EtapaOS, TipoServico } from "@/types/ordens";
import { useEtapaOperations } from "../etapa/hooks/useEtapaOperations";
import EtapaCard from "../etapa/EtapaCard";
import InspecaoServicosSelector from "./InspecaoServicosSelector";
import { EmptyServices } from "./EmptyServices";
import { etapaNomeFormatado } from "@/utils/etapaNomes";

interface EtapaContentProps {
  ordem: OrdemServico;
  etapa: EtapaOS;
  activeServico?: TipoServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: TipoServico) => void;
}

export default function EtapaContent({
  ordem,
  etapa,
  activeServico,
  onOrdemUpdate,
  onFuncionariosChange
}: EtapaContentProps) {
  const [selectedService, setSelectedService] = useState<TipoServico | undefined>(activeServico);
  
  const {
    getServicosEtapa,
    getEtapaInfo,
    handleSubatividadeToggle,
    handleServicoStatusChange,
    handleEtapaStatusChange,
    handleSubatividadeSelecionadaToggle
  } = useEtapaOperations({
    ordem,
    onUpdate: onOrdemUpdate,
  });
  
  const servicosEtapa = getServicosEtapa(etapa, selectedService);
  
  // Determinar quais serviços exibir com base na etapa
  const getServicosFiltrados = () => {
    if (etapa !== "inspecao_inicial" && etapa !== "inspecao_final") {
      return servicosEtapa;
    }
    
    if (selectedService) {
      return servicosEtapa.filter(s => s.tipo === selectedService);
    }
    
    return [];
  };
  
  // Verificar se é etapa de inspeção e precisa selecionar serviço
  const isInspecaoEtapa = etapa === "inspecao_inicial" || etapa === "inspecao_final";
  const servicosFiltrados = getServicosFiltrados();
  const servicosTipo = [...new Set(servicosEtapa.map(s => s.tipo))] as TipoServico[];
  
  if (servicosEtapa.length === 0) {
    return <EmptyServices etapa={etapa} />;
  }
  
  if (isInspecaoEtapa && !selectedService) {
    return (
      <InspecaoServicosSelector
        servicosTipo={servicosTipo}
        onSelect={setSelectedService}
        etapa={etapa}
      />
    );
  }
  
  const etapaInfo = getEtapaInfo(etapa, selectedService);
  const etapaNome = etapaNomeFormatado[etapa] || etapa;
  
  return (
    <div className="mt-4">
      {isInspecaoEtapa && (
        <InspecaoServicosSelector
          servicosTipo={servicosTipo}
          selectedServicoTipo={selectedService}
          onServicoTipoSelect={setSelectedService}
          etapa={etapa}
        />
      )}
      
      <EtapaCard
        ordem={ordem}
        ordemId={ordem.id}
        etapa={etapa}
        etapaNome={etapaNome}
        funcionarioId=""
        servicos={servicosFiltrados}
        etapaInfo={etapaInfo}
        servicoTipo={selectedService}
        onSubatividadeToggle={(tipo, subId, checked) => handleSubatividadeToggle(tipo, subId, checked)}
        onServicoStatusChange={(tipo, concluido, funcId, funcNome) => handleServicoStatusChange(tipo, concluido, funcId, funcNome)}
        onEtapaStatusChange={(etapa, concluida, funcId, funcNome, servicoTipo) => handleEtapaStatusChange(etapa, concluida, funcId, funcNome, servicoTipo)}
        onSubatividadeSelecionadaToggle={(tipo, subId, checked) => handleSubatividadeSelecionadaToggle(tipo, subId, checked)}
        onFuncionariosChange={onFuncionariosChange}
      />
    </div>
  );
}
