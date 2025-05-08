
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
  const getTiposParaEtapa = (etapa: EtapaOS): TipoServico[] => {
    const tiposServicos = ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'];
    
    switch (etapa) {
      case 'inspecao_inicial':
      case 'inspecao_final':
      case 'lavagem':
        return ordem.servicos
          .filter(servico => tiposServicos.includes(servico.tipo))
          .map(servico => servico.tipo);
      case 'retifica':
        if (funcionario?.nivelPermissao !== 'admin' && funcionario?.nivelPermissao !== 'gerente') {
          return ordem.servicos.filter(servico =>
            tiposServicos.includes(servico.tipo) &&
            funcionario?.especialidades.includes(servico.tipo)
          ).map(servico => servico.tipo);
        } else {
          return ordem.servicos.filter(servico =>
            tiposServicos.includes(servico.tipo)
          ).map(servico => servico.tipo);
        }
      default:
        return [];
    }
  };

  const getServicosParaEtapa = (etapa: EtapaOS, servicoTipo?: TipoServico): Servico[] => {
    switch (etapa) {
      case 'retifica':
        if (servicoTipo) {
          // Retornar serviços apenas do tipo específico
          return ordem.servicos.filter(servico => servico.tipo === servicoTipo);
        } else if (funcionario?.nivelPermissao !== 'admin' && funcionario?.nivelPermissao !== 'gerente') {
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
    if ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo) {
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
      (etapa === "inspecao_inicial" || etapa === "inspecao_final" || etapa === "lavagem") 
      && servicoTipo
    ) {
      return `${etapaNomesBR[etapa]} - ${formatServicoTipo(servicoTipo)}`;
    }
    return etapaNomesBR[etapa];
  };

  // Verifica se a etapa atual é Retífica e devemos mostrar cada tipo de serviço separadamente
  if (selectedEtapa === "retifica") {
    const tiposDeServico = getTiposParaEtapa(selectedEtapa);
    
    return (
      <div className="grid gap-4">
        {tiposDeServico.map(tipo => {
          // Buscar serviços deste tipo específico
          const servicosDesseTipo = getServicosParaEtapa(selectedEtapa, tipo);
          
          return (
            <EtapaCard
              key={`${selectedEtapa}-${tipo}`}
              ordemId={ordem.id}
              etapa={selectedEtapa}
              etapaNome={`${getEtapaTitulo(selectedEtapa)} - ${formatServicoTipo(tipo)}`}
              funcionarioId={funcionario?.id || ""}
              funcionarioNome={funcionario?.nome}
              servicos={servicosDesseTipo}
              etapaInfo={getEtapaInfo(selectedEtapa, tipo)}
              servicoTipo={tipo}
              onSubatividadeToggle={onSubatividadeToggle}
              onServicoStatusChange={onServicoStatusChange}
              onEtapaStatusChange={onEtapaStatusChange}
            />
          );
        })}
      </div>
    );
  }

  // Render inspection or washing steps with service types
  else if (selectedEtapa === "inspecao_inicial" || selectedEtapa === "inspecao_final" || selectedEtapa === "lavagem") {
    const tiposParaEtapa = getTiposParaEtapa(selectedEtapa);
    
    return (
      <div className="grid gap-4">
        {tiposParaEtapa.map(tipo => (
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
  
  // Render other steps (montagem, dinamometro)
  else {
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
}
