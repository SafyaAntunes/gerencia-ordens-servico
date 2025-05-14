
import { Servico, TipoServico, EtapaOS, OrdemServico } from "@/types/ordens";
import ServicoTracker from "../servico/ServicoTracker";

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
          onServicoStatusChange={onServicoStatusChange}
          onSubatividadeToggle={onSubatividadeToggle}
          onSubatividadeSelecionadaToggle={onSubatividadeSelecionadaToggle}
        />
      ))}
    </div>
  );
}
