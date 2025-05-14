
import { ServicoTracker } from "../servico";
import { Servico, TipoServico, EtapaOS } from "@/types/ordens";

interface EtapaServiceListProps {
  servicos: Servico[];
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
}

export default function EtapaServiceList({
  servicos,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onSubatividadeToggle,
  onServicoStatusChange
}: EtapaServiceListProps) {
  if (servicos.length === 0) {
    return null;
  }
  
  // Create a dummy ordem object to pass to ServicoTracker
  const dummyOrdem = { id: ordemId } as any;
  
  return (
    <div className="space-y-4">
      {servicos.map((servico, i) => (
        <ServicoTracker
          key={`${servico.tipo}-${i}`}
          servico={servico}
          ordem={dummyOrdem}
          onUpdate={() => {}}  // Add empty onUpdate handler
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
