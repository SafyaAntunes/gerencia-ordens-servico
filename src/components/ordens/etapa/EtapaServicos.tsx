
import { Servico, TipoServico, EtapaOS, OrdemServico } from "@/types/ordens";
import { ServicoTracker } from "@/components/ordens/servico";

interface EtapaServicosProps {
  servicos: Servico[];
  ordem: OrdemServico;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
}

export default function EtapaServicos({
  servicos,
  ordem,
  funcionarioId,
  funcionarioNome,
  etapa,
  onSubatividadeToggle,
  onServicoStatusChange,
  onSubatividadeSelecionadaToggle
}: EtapaServicosProps) {
  if (servicos.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {servicos.map((servico, i) => (
        <ServicoTracker
          key={`${servico.tipo}-${i}`}
          servico={servico}
          ordem={ordem}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          etapa={etapa}
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
          onSubatividadeSelecionadaToggle={
            onSubatividadeSelecionadaToggle ? 
              (subId, checked) => onSubatividadeSelecionadaToggle(servico.tipo, subId, checked) : 
              undefined
          }
        />
      ))}
    </div>
  );
}
