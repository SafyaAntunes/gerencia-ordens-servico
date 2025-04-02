
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EtapaOS } from "@/types/ordens";
import OrdemCronometro from "./OrdemCronometro";
import { formatTime } from "@/utils/timerUtils";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  isConcluida: boolean;
  isIniciada: boolean;
  usarCronometro?: boolean;
  onStart: () => void;
  onFinish: (tempoTotal: number) => void;
  onToggleCronometro?: (usarCronometro: boolean) => void;
  onCompleteWithoutTimer?: () => void;
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
  onStart,
  onFinish,
  onToggleCronometro,
  onCompleteWithoutTimer
}: EtapaCardProps) {
  return (
    <Card className={`p-6 ${isConcluida ? "border-green-500/50" : ""} mb-4`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        {!isConcluida && onToggleCronometro && (
          <div className="flex items-center space-x-2">
            <Switch
              id={`usar-cronometro-${etapa}`}
              checked={usarCronometro}
              onCheckedChange={onToggleCronometro}
            />
            <Label htmlFor={`usar-cronometro-${etapa}`} className="cursor-pointer">
              Usar cronômetro
            </Label>
          </div>
        )}
      </div>
      
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
          onPause={() => {}}
          onResume={() => {}}
          onFinish={(tempoTotal) => onFinish(tempoTotal)}
        />
      ) : !usarCronometro ? (
        <div className="flex items-center justify-center py-4">
          <Checkbox 
            id={`concluir-sem-timer-${etapa}`}
            checked={false}
            onCheckedChange={() => onCompleteWithoutTimer && onCompleteWithoutTimer()}
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
            onPause={() => {}}
            onResume={() => {}}
            onFinish={() => {}}
          />
        </div>
      )}
    </Card>
  );
}
