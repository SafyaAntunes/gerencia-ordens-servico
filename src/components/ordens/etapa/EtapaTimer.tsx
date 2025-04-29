
import { formatTime } from "@/utils/timerUtils";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { EtapaOS, TipoServico } from "@/types/ordens";
import TimerControls from "../TimerControls";
import CompletedTimer from "../CompletedTimer";
import { Badge } from "@/components/ui/badge";
import TimerPausas from "./TimerPausas";

export interface EtapaTimerProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onCustomStart?: () => void;
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function EtapaTimer({
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
}: EtapaTimerProps) {
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
    pausas
  } = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico,
    onStart: () => {
      console.log("Timer started for:", {ordemId, etapa, tipoServico});
      onStart?.();
    },
    onPause,
    onResume,
    onFinish,
    isEtapaConcluida
  });
  
  // Determine status of the stage/service
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
  
  // Function to manage timer start, possibly opening dialog
  const handleStartTimer = () => {
    console.log("handleStartTimer called", {onCustomStart});
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
      
      {/* Tempo em formato menor abaixo do principal (redundante, mas mantido por compatibilidade) */}
      <div className="mb-3 text-sm text-muted-foreground">
        Tempo registrado: {formatTime(displayTime)}
      </div>
      
      {/* Nome do funcionário */}
      {funcionarioNome && (
        <div className="mb-4 text-base">
          Responsável: {funcionarioNome}
        </div>
      )}
      
      <TimerControls
        isRunning={isRunning}
        isPaused={isPaused}
        usarCronometro={usarCronometro}
        onStart={handleStartTimer}
        onPause={handlePause}
        onResume={handleResume}
        onFinish={handleFinish}
      />
      
      {/* Lista de pausas */}
      <TimerPausas pausas={pausas} />
    </div>
  );
}
