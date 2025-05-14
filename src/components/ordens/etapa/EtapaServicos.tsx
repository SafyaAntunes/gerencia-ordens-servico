
import { Servico, TipoServico, EtapaOS, OrdemServico } from "@/types/ordens";
import { ServicoTracker } from "../servico";
import { useCallback, useEffect } from "react";

interface EtapaServicosProps {
  ordem: OrdemServico;
  servicos: Servico[];
  etapa: EtapaOS;
  funcionarioId?: string;
  funcionarioNome?: string;
  servicoTipo?: TipoServico;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export function EtapaServicos({
  ordem,
  servicos,
  etapa,
  funcionarioId = '',
  funcionarioNome = '',
  servicoTipo,
  onServicoStatusChange,
  onSubatividadeToggle,
  onSubatividadeSelecionadaToggle,
  onOrdemUpdate
}: EtapaServicosProps) {
  // Debug logs to track data flow
  useEffect(() => {
    console.log("EtapaServicos - servicos recebidos:", servicos);
    console.log("EtapaServicos - tem callback onOrdemUpdate:", !!onOrdemUpdate);
  }, [servicos, onOrdemUpdate]);

  // Handler to propagate ordem updates to parent component
  const handleOrdemUpdate = useCallback((ordemAtualizada: OrdemServico) => {
    console.log("EtapaServicos - handleOrdemUpdate:", ordemAtualizada);
    if (onOrdemUpdate) {
      onOrdemUpdate(ordemAtualizada);
    }
  }, [onOrdemUpdate]);

  return (
    <div className="space-y-4">
      {servicos.map((servico) => (
        <ServicoTracker
          key={servico.tipo}
          servico={servico}
          ordem={ordem}
          onUpdate={handleOrdemUpdate}
          // Legacy props support
          ordemId={ordem.id}
          etapa={etapa}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          onServicoStatusChange={
            onServicoStatusChange ? 
              (concluido, funcId, funcNome) => onServicoStatusChange(servico.tipo, concluido, funcId, funcNome) : 
              undefined
          }
          onSubatividadeToggle={
            onSubatividadeToggle ? 
              (subatividadeId, checked) => onSubatividadeToggle(servico.tipo, subatividadeId, checked) : 
              undefined
          }
          onSubatividadeSelecionadaToggle={
            onSubatividadeSelecionadaToggle ? 
              (subatividadeId, checked) => onSubatividadeSelecionadaToggle(servico.tipo, subatividadeId, checked) : 
              undefined
          }
        />
      ))}
    </div>
  );
}
