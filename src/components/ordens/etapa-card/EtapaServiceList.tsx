
import { ServicoTracker } from "../servico";
import { Servico, TipoServico, EtapaOS, OrdemServico } from "@/types/ordens";
import { useState, useCallback } from "react";

interface EtapaServiceListProps {
  servicos: Servico[];
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  ordem?: OrdemServico;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export default function EtapaServiceList({
  servicos,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  ordem,
  onSubatividadeToggle,
  onServicoStatusChange,
  onOrdemUpdate
}: EtapaServiceListProps) {
  if (servicos.length === 0) {
    return null;
  }
  
  // Create a proper ordem object to pass to ServicoTracker if none is provided
  const [ordemLocal, setOrdemLocal] = useState<OrdemServico>(() => {
    return ordem || { id: ordemId, servicos: servicos } as OrdemServico;
  });
  
  // Create a proper onUpdate handler that updates the local state
  const handleOrdemUpdate = useCallback((ordemAtualizada: OrdemServico) => {
    console.log("EtapaServiceList - handleOrdemUpdate:", ordemAtualizada);
    
    // Update local state
    setOrdemLocal(ordemAtualizada);
    
    // Pass up to parent if available
    if (onOrdemUpdate) {
      onOrdemUpdate(ordemAtualizada);
    }
  }, [onOrdemUpdate]);
  
  return (
    <div className="space-y-4">
      {servicos.map((servico, i) => (
        <ServicoTracker
          key={`${servico.tipo}-${i}`}
          servico={servico}
          ordem={ordemLocal}
          onUpdate={handleOrdemUpdate}
          ordemId={ordemId}  // Legacy prop
          funcionarioId={funcionarioId}  // Legacy prop
          funcionarioNome={funcionarioNome}  // Legacy prop
          etapa={etapa}  // Legacy prop
          onSubatividadeToggle={
            onSubatividadeToggle ? 
              (subId, checked) => onSubatividadeToggle(servico.tipo, subId, checked) : 
              undefined
          }
          onServicoStatusChange={
            onServicoStatusChange ? 
              (concluido, funcId, funcNome) => onServicoStatusChange(servico.tipo, concluido, funcId, funcNome) : 
              undefined
          }
        />
      ))}
    </div>
  );
}
