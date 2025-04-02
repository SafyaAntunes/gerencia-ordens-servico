
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
  // Filter only retifica services if etapa is retifica
  const retificaServicos = etapa === 'retifica' ? servicos.filter(servico => 
    ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
  ) : [];

  return (
    <Card className={`p-6 ${isConcluida ? "border-green-500/50" : ""} mb-4`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        {!isConcluida && onToggleCronometro && (
          <div className="flex items-center space-x-2">
            <Switch
              id={`usar-cronometro-${etapa}`}
              checked={usarCronometro}
              onCheckedChange={(checked) => onToggleCronometro(checked)}
            />
          </div>
        )}
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
                  (checked) => onServicoStatusChange(servico.tipo, checked) : 
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
          onStart={() => {}}
          onPause={onPause}
          onResume={onResume}
          onFinish={(tempoTotal) => onFinish(tempoTotal)}
        />
      ) : !usarCronometro ? (
        <div className="flex items-center justify-center py-4">
          <Checkbox 
            id={`concluir-sem-timer-${etapa}`}
            checked={false}
            onCheckedChange={(checked) => onCompleteWithoutTimer && onCompleteWithoutTimer()}
            className="mr-2"
          />
          <Label htmlFor={`concluir-sem-timer-${etapa}`} className="cursor-pointer">
            Marcar como concluído
          </Label>
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
            onFinish={() => {}}
          />
        </div>
      )}
    </Card>
  );
}
