
import { Funcionario } from "@/types/funcionarios";
import { EtapaOS, OrdemServico, TipoServico } from "@/types/ordens";
import { useEffect, useState } from "react";
import { InspecaoServicosSelector } from "./InspecaoServicosSelector";
import EtapaCard from "../etapa/EtapaCard";
import { etapaNomesBR, formatServicoTipo } from "./EtapasTracker";

interface EtapaContentProps {
  ordem: OrdemServico;
  selectedEtapa: EtapaOS;
  selectedServicoTipo: TipoServico | null;
  funcionario: Funcionario | null;
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  onSubatividadeSelecionadaToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
}

export function EtapaContent({
  ordem,
  selectedEtapa,
  selectedServicoTipo,
  funcionario,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
  onSubatividadeSelecionadaToggle
}: EtapaContentProps) {
  const [servicosTipoEtapa, setServicosTipoEtapa] = useState<TipoServico[]>([]);
  
  useEffect(() => {
    if (selectedEtapa && (selectedEtapa === 'inspecao_inicial' || selectedEtapa === 'inspecao_final')) {
      const tipoServicos = ordem.servicos.map(s => s.tipo);
      setServicosTipoEtapa(tipoServicos);
    }
  }, [selectedEtapa, ordem.servicos]);
  
  const etapaNome = etapaNomesBR[selectedEtapa] || selectedEtapa;
  
  // Para inspecao_inicial e inspecao_final, precisamos mostrar uma seleção de tipos de serviço
  if ((selectedEtapa === 'inspecao_inicial' || selectedEtapa === 'inspecao_final') && !selectedServicoTipo) {
    return (
      <InspecaoServicosSelector
        servicosTipo={servicosTipoEtapa}
        etapa={selectedEtapa}
      />
    );
  }
  
  // Determinar quais serviços são relevantes para esta etapa
  const servicosRelevantes = ordem.servicos.filter(servico => {
    if (selectedEtapa === 'inspecao_inicial' || selectedEtapa === 'inspecao_final') {
      return servico.tipo === selectedServicoTipo;
    }
    
    if (selectedEtapa === 'montagem') {
      return servico.tipo === 'montagem';
    }
    
    if (selectedEtapa === 'dinamometro') {
      return servico.tipo === 'dinamometro';
    }
    
    if (selectedEtapa === 'retifica') {
      return ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo);
    }
    
    // Para lavagem, retornar todos os serviços com subatividades de lavagem
    if (selectedEtapa === 'lavagem') {
      return servico.subatividades?.some(sub => sub.selecionada) || false;
    }
    
    return false;
  });
  
  const etapaKey = (selectedEtapa === 'inspecao_inicial' || selectedEtapa === 'inspecao_final' || selectedEtapa === 'lavagem') && selectedServicoTipo 
    ? `${selectedEtapa}_${selectedServicoTipo}` 
    : selectedEtapa;
  
  const etapaInfo = ordem.etapasAndamento ? ordem.etapasAndamento[etapaKey] : undefined;
  
  // Mostrar o nome do tipo de serviço para inspeções
  const nomeCompleto = (selectedEtapa === 'inspecao_inicial' || selectedEtapa === 'inspecao_final') && selectedServicoTipo
    ? `${etapaNome} - ${formatServicoTipo(selectedServicoTipo)}`
    : etapaNome;
  
  return (
    <div className="mt-4">
      <EtapaCard
        ordemId={ordem.id}
        etapa={selectedEtapa}
        etapaNome={nomeCompleto}
        funcionarioId={funcionario?.id || ""}
        funcionarioNome={funcionario?.nome}
        servicos={servicosRelevantes}
        etapaInfo={etapaInfo}
        servicoTipo={selectedServicoTipo || undefined}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
        onEtapaStatusChange={onEtapaStatusChange}
        onSubatividadeSelecionadaToggle={onSubatividadeSelecionadaToggle}
      />
    </div>
  );
}
