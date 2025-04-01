
import { Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import CompletedTimer from "./CompletedTimer";
import TimerControls from "./TimerControls";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function OrdemCronometro({
  ordemId,
  funcionarioId,
  funcionarioNome = "João Silva", // Valor padrão para demonstração
  etapa,
  tipoServico,
  onStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: OrdemCronometroProps) {
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
    handleCronometroChange
  } = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico,
    onStart,
    onPause,
    onResume,
    onFinish,
    isEtapaConcluida
  });
  
  // If the stage is completed, just show the saved time without controls
  if (isEtapaConcluida) {
    return <CompletedTimer totalSavedTime={totalSavedTime} />;
  }
  
  return (
    <div className="w-full">
      {/* Funcionário responsável */}
      <div className="mb-2 text-sm">{funcionarioNome}</div>
      
      {/* Tempo no formato hh:mm:ss */}
      <div className="text-right font-mono text-4xl font-bold mb-3">
        {formatTime(displayTime)}
      </div>
      
      <TimerControls
        isRunning={isRunning}
        isPaused={isPaused}
        usarCronometro={usarCronometro}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onFinish={handleFinish}
      />
      
      {/* Opção de usar cronômetro */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`usar-cronometro-${ordemId}-${etapa}`}
          checked={usarCronometro}
          onCheckedChange={handleCronometroChange}
        />
        <label 
          htmlFor={`usar-cronometro-${ordemId}-${etapa}`}
          className="text-sm font-medium leading-none cursor-pointer"
        >
          Usar cronômetro
        </label>
      </div>
    </div>
  );
}
