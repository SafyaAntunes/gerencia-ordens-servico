
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
  const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
  const etapaInfoEspecifica = etapaInfo ? 
    (servicoTipo ? etapaInfo[`${etapa}_${servicoTipo}`] : etapaInfo[etapa]) : 
    undefined;
  
  console.log("EtapaContent - Recebendo serviços:", { etapa, servicoTipo, servicosRecebidos: servicos.map(s => s.tipo) });
  
  // Filtrar serviços com base na etapa atual
  const servicosFiltrados = servicos.filter(servico => {
    // Para etapa de inspeção, já estamos recebendo os serviços filtrados pelo servicoTipo
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      console.log("Filtro de inspeção:", servico.tipo, servicoTipo, servico.tipo === servicoTipo);
      return servico.tipo === servicoTipo;
    }
    
    // Para a etapa de lavagem, mostrar somente os serviços de lavagem
    if (etapa === "lavagem") {
      console.log("Filtro de lavagem:", servico.tipo, servico.tipo === "lavagem");
      return servico.tipo === "lavagem";
    }
    
    // Para a etapa de retifica, considerar os serviços específicos de retifica
    if (etapa === "retifica") {
      const isRetifica = ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(servico.tipo);
      console.log("Filtro de retifica:", servico.tipo, isRetifica);
      return isRetifica;
    }
    
    // Para outras etapas, mostrar serviços do mesmo tipo da etapa
    console.log("Filtro padrão:", servico.tipo, etapa, servico.tipo === etapa);
    return servico.tipo === etapa;
  });
  
  console.log("EtapaContent - Após filtro, mostrando serviços:", servicosFiltrados.map(s => s.tipo));
  
  if (servicosFiltrados.length === 0) {
    console.log("EtapaContent - Nenhum serviço encontrado para a etapa:", etapa);
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
        onFuncionariosChange={onFuncionariosChange}
      />
    </div>
  );
}
