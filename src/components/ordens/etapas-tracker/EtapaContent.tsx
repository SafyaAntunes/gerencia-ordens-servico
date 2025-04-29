
import React from "react";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { EtapaCard } from "@/components/ordens/etapa";
import { formatServicoTipo, etapaNomesBR } from "./EtapasTracker";

interface EtapaContentProps {
  ordem: OrdemServico;
  selectedEtapa: EtapaOS;
  selectedServicoTipo: TipoServico | null;
  funcionario: any;
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
}

export function EtapaContent({
  ordem,
  selectedEtapa,
  selectedServicoTipo,
  funcionario,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange
}: EtapaContentProps) {
  const getTiposParaInspecaoOuLavagem = (etapa: EtapaOS): TipoServico[] => {
    return ordem.servicos
      .filter(servico => ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo))
      .map(servico => servico.tipo);
  };

  const getServicosParaEtapa = (etapa: EtapaOS): Servico[] => {
    switch (etapa) {
      case 'retifica':
        if (funcionario?.nivelPermissao !== 'admin' && funcionario?.nivelPermissao !== 'gerente') {
          return ordem.servicos.filter(servico =>
            ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo) &&
            funcionario?.especialidades.includes(servico.tipo)
          );
        } else {
          return ordem.servicos.filter(servico =>
            ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
          );
        }
      case 'montagem':
        return ordem.servicos.filter(servico => servico.tipo === 'montagem');
      case 'dinamometro':
        return ordem.servicos.filter(servico => servico.tipo === 'dinamometro');
      case 'lavagem':
      case 'inspecao_inicial':
      case 'inspecao_final':
        return [];
      default:
        return [];
    }
  };

  const getEtapaInfo = (etapa: EtapaOS, servicoTipo?: TipoServico) => {
    if ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) {
      const etapaKey = `${etapa}_${servicoTipo}` as any;
      return ordem.etapasAndamento[etapaKey] || { 
        concluido: false,
        servicoTipo: servicoTipo 
      };
    }
    return ordem.etapasAndamento[etapa];
  };

  const getEtapaTitulo = (etapa: EtapaOS, servicoTipo?: TipoServico) => {
    if (
      (etapa === "inspecao_inicial" || etapa === "inspecao_final") 
      && servicoTipo
    ) {
      return `${etapaNomesBR[etapa]} - ${formatServicoTipo(servicoTipo)}`;
    }
    return etapaNomesBR[etapa];
  };

  // Render inspection or washing steps with service types
  if ((selectedEtapa === "inspecao_inicial" || selectedEtapa === "inspecao_final" || selectedEtapa === "lavagem")) {
    return (
      <div className="grid gap-4">
        {getTiposParaInspecaoOuLavagem(selectedEtapa).map(tipo => (
          <EtapaCard
            key={`${selectedEtapa}-${tipo}`}
            ordemId={ordem.id}
            etapa={selectedEtapa}
            etapaNome={getEtapaTitulo(selectedEtapa, tipo)}
            funcionarioId={funcionario?.id || ""}
            funcionarioNome={funcionario?.nome}
            servicos={[]} // No services for inspections and washing
            etapaInfo={getEtapaInfo(selectedEtapa, tipo)}
            servicoTipo={tipo}
            onEtapaStatusChange={onEtapaStatusChange}
          />
        ))}
      </div>
    );
  }
  
  // Render other steps
  return (
    <div>
      {selectedEtapa && funcionario && (
        <EtapaCard
          key={selectedEtapa}
          ordemId={ordem.id}
          etapa={selectedEtapa}
          etapaNome={getEtapaTitulo(selectedEtapa)}
          funcionarioId={funcionario?.id || ""}
          funcionarioNome={funcionario?.nome}
          servicos={getServicosParaEtapa(selectedEtapa)}
          etapaInfo={getEtapaInfo(selectedEtapa)}
          onSubatividadeToggle={onSubatividadeToggle}
          onServicoStatusChange={onServicoStatusChange}
          onEtapaStatusChange={onEtapaStatusChange}
        />
      )}
    </div>
  );
}
