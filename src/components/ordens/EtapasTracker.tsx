
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
  
  const precisaEscolherServico = etapaAtual === "inspecao_inicial" || etapaAtual === "inspecao_final";
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-1/3">
          <EtapasSelector 
            etapaAtual={etapaAtual} 
            onEtapaChange={setEtapaAtual} 
            etapaInfos={etapaInfos}
          />
        </div>
        
        <div className="hidden md:block">
          <Separator orientation="vertical" className="h-64" />
        </div>
        
        <div className="w-full md:w-2/3">
          {precisaEscolherServico && (
            <InspecaoServicosSelector 
              servicoTipo={servicoTipo} 
              onServicoChange={setServicoTipo}
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
