
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
  onCustomStart?: () => boolean;
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
  // Logging detalhado para debug de problemas de renderização
  console.log("EtapaTimer renderizando com props:", {
    ordemId, 
    funcionarioId,
    etapa, 
    tipoServico, 
    isEtapaConcluida,
    hasOnCustomStart: !!onCustomStart,
    hasOnStart: !!onStart,
    hasOnFinish: !!onFinish
  });

  // Validação adicional para prevenir erros
  if (!ordemId || !etapa) {
    console.error("EtapaTimer: props essenciais estão faltando", {
      ordemId, 
      etapa, 
      tipoServico
    });
    return <div className="text-red-500">Erro: Dados insuficientes para iniciar o cronômetro</div>;
  }
  
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
      if (onStart) onStart();
    },
    onPause,
    onResume,
    onFinish: (tempoTotal) => {
      console.log("Timer finished with total time:", tempoTotal, "for", {ordemId, etapa, tipoServico});
      if (onFinish) onFinish(tempoTotal);
    },
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
  
  // Get estimated time based on the service type and stage
  const getTempoEstimado = () => {
    // Simplified estimated times (in minutes) for each type of service/stage
    const temposEstimados: Record<string, number> = {
      inspecao_inicial_bloco: 60, // 60 minutos para inspeção inicial de bloco
      inspecao_inicial_biela: 45, // 45 minutos para inspeção inicial de biela
      inspecao_inicial_cabecote: 50, // 50 minutos para inspeção inicial de cabeçote
      inspecao_inicial_virabrequim: 55, // 55 minutos para inspeção inicial de virabrequim
      inspecao_inicial_eixo_comando: 40, // 40 minutos para inspeção inicial de eixo comando
      inspecao_final_bloco: 45, // 45 minutos para inspeção final de bloco
      inspecao_final_biela: 30, // 30 minutos para inspeção final de biela
      inspecao_final_cabecote: 40, // 40 minutos para inspeção final de cabeçote
      inspecao_final_virabrequim: 45, // 45 minutos para inspeção final de virabrequim
      inspecao_final_eixo_comando: 30, // 30 minutos para inspeção final de eixo comando
      lavagem_bloco: 90, // 90 minutos para lavagem de bloco
      lavagem_biela: 60, // 60 minutos para lavagem de biela
      lavagem_cabecote: 75, // 75 minutos para lavagem de cabeçote
      lavagem_virabrequim: 80, // 80 minutos para lavagem de virabrequim
      lavagem_eixo_comando: 60, // 60 minutos para lavagem de eixo comando
    };

    const key = tipoServico ? `${etapa}_${tipoServico}` : etapa;
    return temposEstimados[key] || 0;
  };
  
  const status = getStatus();
  const tempoEstimadoMinutos = getTempoEstimado();
  
  // Function to manage timer start, possibly opening dialog
  const handleStartTimer = () => {
    console.log("handleStartTimer called in EtapaTimer", {ordemId, etapa, tipoServico});
    
    if (onCustomStart) {
      const shouldStartTimer = onCustomStart();
      console.log("onCustomStart result:", shouldStartTimer);
      
      // Se onCustomStart retornar true, inicie o timer diretamente
      if (shouldStartTimer) {
        console.log("Iniciando timer após confirmação de onCustomStart");
        handleStart();
      }
    } else {
      console.log("Sem onCustomStart, chamando handleStart diretamente");
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
      
      {/* Tempo estimado para concluir a etapa */}
      {tempoEstimadoMinutos > 0 && (
        <div className="mb-3 text-sm text-muted-foreground flex items-center gap-1">
          <span>Tempo estimado:</span>
          <span className="font-medium">{tempoEstimadoMinutos} minutos</span>
        </div>
      )}
      
      {/* Tempo em formato menor abaixo do principal */}
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
