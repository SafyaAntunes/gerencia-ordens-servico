
import React from "react";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import EtapaCard from "@/components/ordens/etapa/EtapaCard";
import { etapaNomesBR } from "./EtapasTracker";

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
  let servicosParaExibir: Servico[] = [];
  
  if (selectedEtapa === 'inspecao_inicial' || selectedEtapa === 'inspecao_final' || selectedEtapa === 'lavagem') {
    // Para estas etapas, precisamos exibir os serviços separadamente
    servicosParaExibir = ordem.servicos.filter(servico => {
      // Excluir serviços do tipo lavagem, inspecao_inicial e inspecao_final
      // pois serão tratados como etapas independentes
      if (servico.tipo === 'lavagem' || 
          servico.tipo === 'inspecao_inicial' || 
          servico.tipo === 'inspecao_final') {
        return false;
      }
      
      // Incluir apenas serviços com subatividades selecionadas
      return servico.subatividades && servico.subatividades.some(sub => sub.selecionada);
    });
    
    // Mostrar um card para cada serviço
    return (
      <div className="space-y-6 mt-4">
        {servicosParaExibir.map((servico) => (
          <EtapaCard
            key={`${selectedEtapa}-${servico.tipo}`}
            ordemId={ordem.id}
            etapa={selectedEtapa}
            etapaNome={`${etapaNomesBR[selectedEtapa]} - ${formatServicoTipoLocal(servico.tipo)}`}
            funcionarioId={funcionario?.id || ""}
            funcionarioNome={funcionario?.nome}
            servicos={[servico]}
            etapaInfo={getEtapaInfoForServico(ordem, selectedEtapa, servico.tipo)}
            servicoTipo={servico.tipo}
            onSubatividadeToggle={onSubatividadeToggle}
            onServicoStatusChange={onServicoStatusChange}
            onEtapaStatusChange={onEtapaStatusChange}
          />
        ))}
      </div>
    );
  } else {
    // Para outras etapas, exibir todos os serviços relevantes em um único card
    servicosParaExibir = ordem.servicos.filter(servico => {
      // Para retifica, exibir serviços do tipo bloco, biela, cabecote, virabrequim, eixo_comando
      if (selectedEtapa === 'retifica') {
        return ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo);
      }
      
      // Para montagem, exibir serviços do tipo montagem
      if (selectedEtapa === 'montagem') {
        return servico.tipo === 'montagem';
      }
      
      // Para dinamometro, exibir serviços do tipo dinamometro
      if (selectedEtapa === 'dinamometro') {
        return servico.tipo === 'dinamometro';
      }
      
      return false;
    }).filter(servico => {
      // Filtrar apenas serviços com subatividades selecionadas
      return servico.subatividades && servico.subatividades.some(sub => sub.selecionada);
    });
    
    // Mostrar um card para a etapa com todos os serviços relevantes
    return (
      <div className="mt-4">
        <EtapaCard
          ordemId={ordem.id}
          etapa={selectedEtapa}
          etapaNome={etapaNomesBR[selectedEtapa]}
          funcionarioId={funcionario?.id || ""}
          funcionarioNome={funcionario?.nome}
          servicos={servicosParaExibir}
          etapaInfo={ordem.etapasAndamento?.[selectedEtapa]}
          onSubatividadeToggle={onSubatividadeToggle}
          onServicoStatusChange={onServicoStatusChange}
          onEtapaStatusChange={onEtapaStatusChange}
        />
      </div>
    );
  }
}

// Funções auxiliares
function formatServicoTipoLocal(tipo: TipoServico): string {
  const labels: Record<TipoServico, string> = {
    bloco: "Bloco",
    biela: "Biela",
    cabecote: "Cabeçote",
    virabrequim: "Virabrequim",
    eixo_comando: "Eixo de Comando",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    inspecao_final: "Inspeção Final"
  };
  return labels[tipo] || tipo;
}

function getEtapaInfoForServico(ordem: OrdemServico, etapa: EtapaOS, servicoTipo: TipoServico) {
  const etapaKey = `${etapa}_${servicoTipo}`;
  return ordem.etapasAndamento?.[etapaKey];
}
