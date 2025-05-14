
import React, { useState, useEffect } from "react";
import { OrdemServico, Servico, TipoServico, EtapaOS } from "@/types/ordens";
import { Separator } from "@/components/ui/separator";
import { useEtapasProgress } from "@/components/ordens/etapas-tracker/useEtapasProgress";
// Import components directly to avoid errors
import EtapaContent from "@/components/ordens/etapas-tracker/EtapaContent";
import EtapasSelector from "@/components/ordens/etapas-tracker/EtapasSelector";

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
  
  // Get services by etapa
  const getServicosByEtapa = () => {
    const result: Record<EtapaOS, Servico[]> = {} as Record<EtapaOS, Servico[]>;
    
    ordem.servicos.forEach(servico => {
      let etapa: EtapaOS;
      if (servico.tipo === 'lavagem') {
        etapa = 'lavagem';
      } else if (servico.tipo === 'inspecao_inicial') {
        etapa = 'inspecao_inicial';
      } else if (servico.tipo === 'inspecao_final') {
        etapa = 'inspecao_final';
      } else if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)) {
        etapa = 'retifica';
      } else if (servico.tipo === 'montagem') {
        etapa = 'montagem';
      } else if (servico.tipo === 'dinamometro') {
        etapa = 'dinamometro';
      } else {
        return;
      }

      if (!result[etapa]) {
        result[etapa] = [];
      }
      result[etapa].push(servico);
    });
    
    return result;
  };
  
  const servicosByEtapa = getServicosByEtapa();
  
  // Limpar o tipo de serviço quando a etapa mudar
  useEffect(() => {
    if (!precisaEscolherServico) {
      setServicoTipo(undefined);
    }
  }, [etapaAtual, precisaEscolherServico]);
  
  // Manipulador de mudança de etapa
  const handleEtapaSelect = (novaEtapa: EtapaOS) => {
    setEtapaAtual(novaEtapa);
    
    // Se a nova etapa não precisar escolher serviço, limpar o tipo de serviço
    if (!(novaEtapa === "inspecao_inicial" || novaEtapa === "inspecao_final")) {
      setServicoTipo(undefined);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-1/3">
          <EtapasSelector 
            etapasAtivas={etapasAtivas}
            selectedEtapa={etapaAtual}
            etapasDisponiveis={etapasDisponiveis}
            onEtapaSelect={handleEtapaSelect}
            isRetificaHabilitada={isRetificaHabilitada}
            isInspecaoFinalHabilitada={isInspecaoFinalHabilitada}
          />
        </div>
        
        <div className="hidden md:block">
          <Separator orientation="vertical" className="h-64" />
        </div>
        
        <div className="w-full md:w-2/3">
          {(etapaAtual && (!precisaEscolherServico || servicoTipo)) && (
            <EtapaContent 
              ordem={ordem}
              etapa={etapaAtual}
              activeServico={servicoTipo}
              onOrdemUpdate={onOrdemUpdate}
              onFuncionariosChange={onFuncionariosChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
