
import { useState, useEffect, useCallback } from "react";
import { OrdemServico, EtapaOS, TipoServico } from "@/types/ordens";
import { useEtapaOperations } from "../etapa/hooks/useEtapaOperations";
import EtapaCard from "../etapa/EtapaCard";
import InspecaoServicosSelector from "./InspecaoServicosSelector";
import { EmptyServices } from "./EmptyServices";
import { etapaNomeFormatado } from "@/utils/etapaNomes";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface EtapaContentProps {
  ordem: OrdemServico;
  etapa: EtapaOS;
  activeServico?: TipoServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: TipoServico) => void;
}

export default function EtapaContent({
  ordem,
  etapa,
  activeServico,
  onOrdemUpdate,
  onFuncionariosChange
}: EtapaContentProps) {
  const [selectedService, setSelectedService] = useState<TipoServico | undefined>(activeServico);
  const [isReloading, setIsReloading] = useState(false);
  const [localOrdem, setLocalOrdem] = useState<OrdemServico>(ordem);
  
  // Log ordem updates for debugging
  useEffect(() => {
    console.log("EtapaContent - ordem atualizada:", {
      id: ordem.id,
      servicosCount: ordem.servicos.length,
      status: ordem.status
    });
    setLocalOrdem(ordem);
  }, [ordem]);
  
  const {
    getServicosEtapa,
    getEtapaInfo,
    handleSubatividadeToggle,
    handleServicoStatusChange,
    handleEtapaStatusChange,
    handleSubatividadeSelecionadaToggle
  } = useEtapaOperations({
    ordem: localOrdem,
    onUpdate: onOrdemUpdate,
  });
  
  // Function to reload fresh ordem data from Firebase
  const reloadOrdemData = useCallback(async () => {
    if (!ordem.id) return;
    
    setIsReloading(true);
    console.log("EtapaContent - Recarregando dados da ordem do Firebase:", ordem.id);
    
    try {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnap = await getDoc(ordemRef);
      
      if (ordemSnap.exists()) {
        const ordemData = { ...ordemSnap.data(), id: ordemSnap.id } as OrdemServico;
        console.log("EtapaContent - Dados atualizados da ordem:", ordemData);
        
        // Update local state
        setLocalOrdem(ordemData);
        
        // Notify parent component
        onOrdemUpdate(ordemData);
        
        toast.success("Dados atualizados com sucesso", {
          duration: 2000,
          position: "bottom-right"
        });
      } else {
        console.log("EtapaContent - Ordem não encontrada no Firebase");
        toast.error("Não foi possível encontrar a ordem");
      }
    } catch (error) {
      console.error("EtapaContent - Erro ao recarregar dados da ordem:", error);
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsReloading(false);
    }
  }, [ordem.id, onOrdemUpdate]);
  
  // Handle ordem updates from child components
  const handleLocalOrdemUpdate = useCallback((ordemAtualizada: OrdemServico) => {
    console.log("EtapaContent - handleLocalOrdemUpdate:", ordemAtualizada);
    setLocalOrdem(ordemAtualizada);
    onOrdemUpdate(ordemAtualizada);
    
    // Schedule a reload after a short delay to ensure Firebase data is up to date
    setTimeout(reloadOrdemData, 500);
  }, [onOrdemUpdate, reloadOrdemData]);
  
  // Get services for the current etapa
  const servicosEtapa = getServicosEtapa(etapa, selectedService);
  
  // Determine which services to display based on the etapa
  const getServicosFiltrados = () => {
    if (etapa !== "inspecao_inicial" && etapa !== "inspecao_final") {
      return servicosEtapa;
    }
    
    if (selectedService) {
      return servicosEtapa.filter(s => s.tipo === selectedService);
    }
    
    return [];
  };
  
  // Check if this is an inspection etapa that requires selecting a service
  const isInspecaoEtapa = etapa === "inspecao_inicial" || etapa === "inspecao_final";
  const servicosFiltrados = getServicosFiltrados();
  const servicosTipo = [...new Set(servicosEtapa.map(s => s.tipo))] as TipoServico[];
  
  if (servicosEtapa.length === 0) {
    return <EmptyServices etapa={etapa} />;
  }
  
  if (isInspecaoEtapa && !selectedService) {
    return (
      <InspecaoServicosSelector
        servicosTipo={servicosTipo}
        onSelect={setSelectedService}
        etapa={etapa}
      />
    );
  }
  
  const etapaInfo = getEtapaInfo(etapa, selectedService);
  const etapaNome = etapaNomeFormatado[etapa] || etapa;
  
  return (
    <div className="mt-4">
      {isReloading && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-center">
          Atualizando dados da ordem...
        </div>
      )}
      
      {isInspecaoEtapa && (
        <InspecaoServicosSelector
          servicosTipo={servicosTipo}
          selectedServicoTipo={selectedService}
          onServicoTipoSelect={setSelectedService}
          etapa={etapa}
        />
      )}
      
      <EtapaCard
        ordem={localOrdem}
        ordemId={localOrdem.id}
        etapa={etapa}
        etapaNome={etapaNome}
        funcionarioId=""
        servicos={servicosFiltrados}
        etapaInfo={etapaInfo}
        servicoTipo={selectedService}
        onSubatividadeToggle={(tipo, subId, checked) => handleSubatividadeToggle(tipo, subId, checked)}
        onServicoStatusChange={(tipo, concluido, funcId, funcNome) => handleServicoStatusChange(tipo, concluido, funcId, funcNome)}
        onEtapaStatusChange={(etapa, concluida, funcId, funcNome, servicoTipo) => handleEtapaStatusChange(etapa, concluida, funcId, funcNome, servicoTipo)}
        onSubatividadeSelecionadaToggle={(tipo, subId, checked) => handleSubatividadeSelecionadaToggle(tipo, subId, checked)}
        onFuncionariosChange={onFuncionariosChange}
        onOrdemUpdate={handleLocalOrdemUpdate}
      />
      
      {/* Manual refresh button */}
      <div className="mt-4 flex justify-end">
        <button
          className="text-sm text-muted-foreground hover:text-primary flex items-center"
          onClick={reloadOrdemData}
          disabled={isReloading}
        >
          <span className="mr-1">{isReloading ? "Recarregando..." : "Recarregar dados"}</span>
        </button>
      </div>
    </div>
  );
}
