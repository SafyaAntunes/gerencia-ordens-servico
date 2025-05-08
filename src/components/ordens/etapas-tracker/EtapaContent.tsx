
import { useEffect, useState } from "react";
import { OrdemServico, EtapaOS, Servico, TipoServico } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import ServicoTracker from "../servico/ServicoTracker";
import { getServicosForEtapa } from "../servico/hooks/utils/servicoTrackerUtils";

interface EtapaContentProps {
  ordem: OrdemServico;
  selectedEtapa: EtapaOS;
  selectedServicoTipo: TipoServico | null;
  funcionario: Funcionario | null;
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange: (
    etapa: EtapaOS,
    concluida: boolean,
    funcionarioId?: string,
    funcionarioNome?: string,
    servicoTipo?: TipoServico
  ) => void;
}

export function EtapaContent({
  ordem,
  selectedEtapa,
  selectedServicoTipo,
  funcionario,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange
}: EtapaContentProps) {
  const [servicos, setServicos] = useState<Servico[]>([]);

  useEffect(() => {
    if (ordem && selectedEtapa) {
      // Use our utility function to get all service types for the selected etapa
      const servicoTipos = getServicosForEtapa(selectedEtapa);
      
      // Filter services that belong to the selected etapa
      const etapaServicos = ordem.servicos.filter(servico => 
        servicoTipos.includes(servico.tipo)
      );
      
      setServicos(etapaServicos);
    }
  }, [ordem, selectedEtapa]);

  if (servicos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum serviço encontrado</CardTitle>
          <CardDescription>
            Não existem serviços configurados para esta etapa.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {servicos.map((servico) => (
        <ServicoTracker
          key={servico.tipo}
          servico={servico}
          ordemId={ordem.id}
          funcionarioId={funcionario?.id}
          funcionarioNome={funcionario?.nome}
          onSubatividadeToggle={(subatividadeId, checked) => 
            onSubatividadeToggle(servico.tipo, subatividadeId, checked)
          }
          onServicoStatusChange={(concluido, funcionarioId, funcionarioNome) => 
            onServicoStatusChange(servico.tipo, concluido, funcionarioId, funcionarioNome)
          }
          etapa={selectedEtapa}
        />
      ))}
    </div>
  );
}
