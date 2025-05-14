
import { ServicoTracker } from "../../../servico";
import { EtapaOS, Servico, TipoServico, OrdemServico } from "@/types/ordens";

interface EtapaServicosListaProps {
  servicos: Servico[];
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
}

export default function EtapaServicosLista({
  servicos,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onSubatividadeToggle,
  onServicoStatusChange
}: EtapaServicosListaProps) {
  if (servicos.length === 0) {
    return null;
  }
  
  // Create a dummy ordem object to pass to ServicoTracker
  const dummyOrdem: OrdemServico = { id: ordemId } as OrdemServico;
  
  return (
    <div className="space-y-4">
      {servicos.map((servico, i) => (
        <ServicoTracker
          key={`${servico.tipo}-${i}`}
          servico={servico}
          ordem={dummyOrdem}
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
