
import { Servico, TipoServico, EtapaOS, OrdemServico } from "@/types/ordens";
import { ServicoTracker } from "../servico";

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
  onSubatividadeSelecionadaToggle
}: EtapaServicosProps) {
  return (
    <div className="space-y-4">
      {servicos.map((servico) => (
        <ServicoTracker
          key={servico.tipo}
          servico={servico}
          ordem={ordem}
          onUpdate={(ordem) => {}}
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
