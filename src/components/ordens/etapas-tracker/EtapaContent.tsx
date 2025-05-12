
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";
import { Card } from "@/components/ui/card";
import { EmptyServices } from "./EmptyServices";
import EtapaCard from "@/components/ordens/etapa/EtapaCard";
import { etapaNomes } from "@/utils/etapaNomes";

interface EtapaContentProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaInfo?: any;
  servicos: Servico[];
  servicoTipo?: TipoServico;
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  onSubatividadeSelecionadaToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: string) => void;
}

export default function EtapaContent({
  ordemId,
  etapa,
  etapaInfo,
  servicos,
  servicoTipo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
  onSubatividadeSelecionadaToggle,
  onFuncionariosChange
}: EtapaContentProps) {
  // Filter services based on the etapa
  const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
  const etapaInfoEspecifica = etapaInfo ? 
    (servicoTipo ? etapaInfo[`${etapa}_${servicoTipo}`] : etapaInfo[etapa]) : 
    undefined;
  
  // Filter services to only show the relevant ones for this etapa
  const servicosFiltrados = servicos.filter(servico => {
    // For inspection stages, only show the selected service type
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return servico.tipo === servicoTipo;
    }
    
    // For lavagem stage, only show lavagem services
    if (etapa === "lavagem") {
      return servico.tipo === "lavagem";
    }
    
    // For retifica, only show retifica related services
    if (etapa === "retifica") {
      return ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(servico.tipo);
    }
    
    // For other stages, return the specific services
    return servico.tipo === etapa;
  });
  
  if (servicosFiltrados.length === 0) {
    return <EmptyServices etapa={etapa} />;
  }

  const getNomeEtapa = (etapa: EtapaOS, servicoTipo?: TipoServico): string => {
    let nome = etapaNomes[etapa] || etapa.replace('_', ' ');
    
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      const servicoNome = servicoTipo.replace('_', ' ');
      nome += ` - ${servicoNome.charAt(0).toUpperCase() + servicoNome.slice(1)}`;
    }
    
    return nome;
  };

  return (
    <div className="space-y-4">
      <EtapaCard
        ordemId={ordemId}
        etapa={etapa}
        etapaNome={getNomeEtapa(etapa, servicoTipo)}
        funcionarioId={etapaInfoEspecifica?.funcionarioId || ""}
        funcionarioNome={etapaInfoEspecifica?.funcionarioNome || ""}
        servicos={servicosFiltrados}
        etapaInfo={etapaInfoEspecifica}
        servicoTipo={servicoTipo}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
        onEtapaStatusChange={onEtapaStatusChange}
        onSubatividadeSelecionadaToggle={onSubatividadeSelecionadaToggle}
        onFuncionariosChange={onFuncionariosChange}
      />
    </div>
  );
}
