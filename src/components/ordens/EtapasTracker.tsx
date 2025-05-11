import React, { useState } from "react";
import { OrdemServico, Servico, TipoServico, EtapaOS } from "@/types/ordens";
import { EtapaContent, EtapasSelector, InspecaoServicosSelector } from "@/components/ordens/etapas-tracker";
import { Separator } from "@/components/ui/separator";
import { useEtapasProgress } from "@/components/ordens/etapas-tracker/useEtapasProgress";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: string) => void;
}

export default function EtapasTracker({ ordem, onOrdemUpdate, onFuncionariosChange }: EtapasTrackerProps) {
  const [etapaAtual, setEtapaAtual] = useState<EtapaOS>("lavagem");
  const [servicoTipo, setServicoTipo] = useState<TipoServico | undefined>(undefined);
  
  const { 
    etapaInfos, 
    servicosByEtapa, 
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
    return ordem.etapasAndamento.retifica?.concluido === true;
  };
  
  const precisaEscolherServico = etapaAtual === "inspecao_inicial" || etapaAtual === "inspecao_final";
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-1/3">
          <EtapasSelector 
            etapasAtivas={etapasAtivas}
            selectedEtapa={etapaAtual}
            etapasDisponiveis={etapasDisponiveis}
            onEtapaSelect={setEtapaAtual}
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
            />
          )}
          
          {(etapaAtual && (!precisaEscolherServico || servicoTipo)) && (
            <EtapaContent 
              ordemId={ordem.id}
              etapa={etapaAtual}
              etapaInfo={etapaInfos[etapaAtual]}
              servicos={
                precisaEscolherServico && servicoTipo ? 
                  ordem.servicos.filter(s => s.tipo === servicoTipo) : 
                  servicosByEtapa[etapaAtual] || []
              }
              servicoTipo={servicoTipo}
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
