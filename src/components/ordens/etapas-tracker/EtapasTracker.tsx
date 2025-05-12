
import React, { useState } from "react";
import { OrdemServico, Servico, TipoServico, EtapaOS } from "@/types/ordens";
import { Separator } from "@/components/ui/separator";
import { useEtapasProgress } from "@/components/ordens/etapas-tracker/useEtapasProgress";
// Import components directly to avoid errors
import EtapaContent from "@/components/ordens/etapas-tracker/EtapaContent";
import EtapasSelector from "@/components/ordens/etapas-tracker/EtapasSelector";
import InspecaoServicosSelector from "@/components/ordens/etapas-tracker/InspecaoServicosSelector";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: string) => void;
}

export default function EtapasTracker({ ordem, onOrdemUpdate, onFuncionariosChange }: EtapasTrackerProps) {
  const [etapaAtual, setEtapaAtual] = useState<EtapaOS>("lavagem");
  const [servicoTipo, setServicoTipo] = useState<TipoServico | undefined>(undefined);
  
  const { 
    progressoTotal, 
    calcularProgressoTotal,
    handleSubatividadeToggle,
    handleServicoStatusChange,
    handleEtapaStatusChange, 
    handleSubatividadeSelecionadaToggle
  } = useEtapasProgress({ ordem, onOrdemUpdate });

  const etapasAtivas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
  const etapasDisponiveis = {
    montagem: ordem.servicos.some(s => s.tipo === "montagem"),
    dinamometro: ordem.servicos.some(s => s.tipo === "dinamometro")
  };

  const isRetificaHabilitada = () => {
    return ordem.servicos.some(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo)
    );
  };

  const isInspecaoFinalHabilitada = () => {
    return ordem.etapasAndamento?.retifica?.concluido === true;
  };
  
  const precisaEscolherServico = etapaAtual === "inspecao_inicial" || etapaAtual === "inspecao_final";
  
  // Get services by etapa with correct filtering
  const getServicosByEtapa = () => {
    const result: Record<EtapaOS, Servico[]> = {} as Record<EtapaOS, Servico[]>;
    
    // Process each service and put it in the appropriate etapa bucket
    ordem.servicos.forEach(servico => {
      let etapa: EtapaOS;
      
      if (servico.tipo === 'lavagem') {
        etapa = 'lavagem';
      } else if (servico.tipo === 'montagem') {
        etapa = 'montagem';
      } else if (servico.tipo === 'dinamometro') {
        etapa = 'dinamometro';
      } else if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)) {
        // All these services belong to the retifica etapa
        etapa = 'retifica';
      } else if (servico.tipo === 'inspecao_inicial') {
        etapa = 'inspecao_inicial';
      } else if (servico.tipo === 'inspecao_final') {
        etapa = 'inspecao_final';
      } else {
        return; // Skip unknown service types
      }

      if (!result[etapa]) {
        result[etapa] = [];
      }
      result[etapa].push(servico);
    });
    
    return result;
  };
  
  const servicosByEtapa = getServicosByEtapa();
  
  // Handler for service type selection
  const handleServicoTipoSelect = (tipo: TipoServico) => {
    setServicoTipo(tipo);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-1/3">
          <EtapasSelector 
            etapasAtivas={etapasAtivas}
            selectedEtapa={etapaAtual}
            etapasDisponiveis={etapasDisponiveis}
            onEtapaSelect={(etapa) => {
              setEtapaAtual(etapa);
              // Reset servicoTipo when changing etapa except for inspecao
              if (etapa !== "inspecao_inicial" && etapa !== "inspecao_final") {
                setServicoTipo(undefined);
              }
            }}
            isRetificaHabilitada={isRetificaHabilitada}
            isInspecaoFinalHabilitada={isInspecaoFinalHabilitada}
          />
        </div>
        
        <div className="hidden md:block">
          <Separator orientation="vertical" className="h-64" />
        </div>
        
        <div className="w-full md:w-2/3">
          {precisaEscolherServico && (
            <InspecaoServicosSelector 
              servicosTipo={["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"]}
              etapa={etapaAtual}
              selectedServicoTipo={servicoTipo}
              onServicoTipoSelect={handleServicoTipoSelect}
            />
          )}
          
          {(etapaAtual && (!precisaEscolherServico || servicoTipo)) && (
            <EtapaContent 
              ordemId={ordem.id}
              etapa={etapaAtual}
              etapaInfo={ordem.etapasAndamento}
              servicos={
                servicosByEtapa[etapaAtual] || []
              }
              servicoTipo={precisaEscolherServico ? servicoTipo : undefined}
              onSubatividadeToggle={handleSubatividadeToggle}
              onServicoStatusChange={handleServicoStatusChange}
              onEtapaStatusChange={handleEtapaStatusChange}
              onSubatividadeSelecionadaToggle={handleSubatividadeSelecionadaToggle}
              onFuncionariosChange={onFuncionariosChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
