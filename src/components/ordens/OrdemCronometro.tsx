
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { useAuth } from "@/hooks/useAuth";
import CompletedTimer from "./CompletedTimer";
import TimerControls from "./TimerControls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onCustomStart?: () => void; // Novo prop para inicialização customizada
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function OrdemCronometro({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  onStart,
  onCustomStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: OrdemCronometroProps) {
  const { funcionario } = useAuth();
  
  const {
    isRunning,
    isPaused,
    usarCronometro,
    displayTime,
    totalSavedTime,
    handleStart,
    handlePause,
    handleResume,
    handleFinish,
    handleCronometroChange,
    pausas
  } = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico,
    onStart: () => {
      // Chama o onStart original, que vai atualizar o status para "em andamento"
      if (onStart) onStart();
    },
    onPause,
    onResume,
    onFinish,
    isEtapaConcluida
  });
  
  // Determinar o status da etapa/serviço
  const getStatus = () => {
    if (isEtapaConcluida) {
      return "concluido";
    } else if (isRunning || isPaused) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  const status = getStatus();
  
  // Função para gerenciar o início do timer, possivelmente abrindo o diálogo
  const handleStartTimer = () => {
    if (onCustomStart) {
      onCustomStart();
    } else {
      handleStart();
    }
  };
  
  // If the stage is completed, just show the saved time without controls
  if (isEtapaConcluida) {
    return <CompletedTimer totalSavedTime={totalSavedTime} />;
  }
  
  return (
    <div className="w-full">
      {/* Nome da etapa e tempo em destaque */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">{formatTime(displayTime)}</h3>
          {status === "em_andamento" && (
            <Badge variant="outline">Em andamento</Badge>
          )}
          {status === "nao_iniciado" && (
            <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
          )}
        </div>
      </div>
      
      {/* Tempo em formato menor abaixo do principal */}
      <div className="mb-3 text-lg">
        {formatTime(displayTime)}
      </div>
      
      {/* Nome do funcionário */}
      {funcionarioNome && (
        <div className="mb-4 text-base">
          {funcionarioNome}
        </div>
      )}
      
      <TimerControls
        isRunning={isRunning}
        isPaused={isPaused}
        usarCronometro={usarCronometro}
        onStart={handleStartTimer} // Usando a nova função personalizada
        onPause={handlePause}
        onResume={handleResume}
        onFinish={handleFinish}
      />
      
      {/* Checkbox escondido mas mantendo a funcionalidade */}
      <div className="hidden">
        <Checkbox 
          id={`usar-cronometro-${ordemId}-${etapa}`}
          checked={usarCronometro}
          onCheckedChange={handleCronometroChange}
          className="text-green-500 border-green-500"
        />
      </div>
      
      {/* Lista de pausas */}
      {pausas && pausas.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Pausas registradas:</h4>
          <ul className="text-xs space-y-1">
            {pausas.map((pausa, index) => (
              <li key={index} className="bg-gray-50 p-2 rounded">
                <div className="font-medium">
                  {new Date(pausa.inicio).toLocaleTimeString()} {pausa.fim ? `- ${new Date(pausa.fim).toLocaleTimeString()}` : '(em andamento)'}
                </div>
                {pausa.motivo && <div className="text-muted-foreground">Motivo: {pausa.motivo}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
