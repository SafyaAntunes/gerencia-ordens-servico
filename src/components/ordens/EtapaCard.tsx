
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import OrdemCronometro from "./OrdemCronometro";
import { formatTime } from "@/utils/timerUtils";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import ServicoTracker from "./ServicoTracker";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  isConcluida: boolean;
  isIniciada: boolean;
  usarCronometro?: boolean;
  servicos?: Servico[];
  onStart: () => void;
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish: (tempoTotal: number) => void;
  onToggleCronometro?: (usarCronometro: boolean) => void;
  onCompleteWithoutTimer?: () => void;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  isConcluida,
  isIniciada,
  usarCronometro = true,
  servicos = [],
  onStart,
  onPause,
  onResume,
  onFinish,
  onToggleCronometro,
  onCompleteWithoutTimer,
  onSubatividadeToggle,
  onServicoStatusChange
}: EtapaCardProps) {
  const { funcionario } = useAuth();
  
  // Filter only retifica services if etapa is retifica
  const retificaServicos = etapa === 'retifica' ? servicos.filter(servico => 
    ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
  ) : [];
  
  const handleCompleteWithoutTimer = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return;
    }
    
    if (onCompleteWithoutTimer) {
      onCompleteWithoutTimer();
    }
  };

  return (
    <Card className={`p-6 ${isConcluida ? "border-green-500/50" : ""} mb-4`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        
        {/* Removendo o switch da interface, mas mantendo a funcionalidade na implementação */}
        <div className="hidden">
          {!isConcluida && onToggleCronometro && (
            <Switch
              id={`usar-cronometro-${etapa}`}
              checked={usarCronometro}
              onCheckedChange={(checked) => onToggleCronometro(checked)}
            />
          )}
        </div>
      </div>
      
      {/* Show service trackers inside retifica etapa */}
      {etapa === 'retifica' && retificaServicos.length > 0 && (
        <div className="mb-6 space-y-4">
          <h4 className="text-md font-medium">Serviços de Retífica</h4>
          {retificaServicos.map((servico, i) => (
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
      
      {isConcluida ? (
        <OrdemCronometro
          ordemId={ordemId}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          etapa={etapa}
          isEtapaConcluida={true}
        />
      ) : isIniciada ? (
        <OrdemCronometro
          ordemId={ordemId}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          etapa={etapa}
          onPause={onPause}
          onResume={onResume}
          onFinish={onFinish}
        />
      ) : !usarCronometro ? (
        <div className="flex items-center justify-center py-4">
          <Button
            onClick={handleCompleteWithoutTimer}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Marcar como concluído
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome || ""}
            etapa={etapa}
            onStart={onStart}
            onPause={onPause}
            onResume={onResume}
            onFinish={onFinish}
          />
        </div>
      )}
    </Card>
  );
}
