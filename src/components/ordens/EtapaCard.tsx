
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import ServicoTracker from "./ServicoTracker";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos?: Servico[];
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  onSubatividadeToggle,
  onServicoStatusChange
}: EtapaCardProps) {
  const [progresso, setProgresso] = useState(0);
  
  // Filter services based on etapa type
  const etapaServicos = (() => {
    switch(etapa) {
      case 'retifica':
        return servicos.filter(servico => 
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
      case 'montagem':
        return servicos.filter(servico => servico.tipo === 'montagem');
      case 'dinamometro':
        return servicos.filter(servico => servico.tipo === 'dinamometro');
      case 'lavagem':
      case 'inspecao_inicial':
      case 'inspecao_final':
        // Estas etapas não têm serviços específicos associados
        return [];
      default:
        return [];
    }
  })();

  // Calcular o progresso da etapa baseado nos serviços concluídos
  useEffect(() => {
    if (etapaServicos.length === 0) return;
    
    const servicosConcluidos = etapaServicos.filter(servico => servico.concluido).length;
    const percentualProgresso = Math.round((servicosConcluidos / etapaServicos.length) * 100);
    setProgresso(percentualProgresso);
  }, [etapaServicos]);

  // Se não houver serviços específicos para esta etapa, exiba uma mensagem
  if (etapaServicos.length === 0 && ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa)) {
    return (
      <Card className="p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{etapaNome}</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-muted-foreground">Esta etapa não possui serviços específicos.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        {etapaServicos.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="ml-2">
              {progresso}% Concluído
            </Badge>
          </div>
        )}
      </div>
      
      {/* Progress bar para a etapa baseado nos serviços */}
      {etapaServicos.length > 0 && (
        <div className="mb-4">
          <Progress value={progresso} className="h-2" />
        </div>
      )}
      
      {/* Show service trackers */}
      {etapaServicos.length > 0 && (
        <div className="space-y-4">
          {etapaServicos.map((servico, i) => (
            <ServicoTracker
              key={`${servico.tipo}-${i}`}
              servico={servico}
              ordemId={ordemId}
              funcionarioId={funcionarioId}
              funcionarioNome={funcionarioNome}
              onSubatividadeToggle={
                onSubatividadeToggle ? 
                  (subId, checked) => onSubatividadeToggle(servico.tipo, subId, checked) : 
                  () => {}
              }
              onServicoStatusChange={
                onServicoStatusChange ? 
                  (concluido) => onServicoStatusChange(servico.tipo, concluido) : 
                  () => {}
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
