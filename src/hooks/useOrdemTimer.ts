
import { useTimerState } from "./timer/useTimerState";
import { createTimerHandlers } from "./timer/timerHandlers";
import { UseOrdemTimerProps, UseOrdemTimerResult } from "@/types/timer";
import { EtapaOS, TipoServico } from "@/types/ordens";

export function useOrdemTimer({
  ordemId,
  etapa,
  tipoServico,
  onStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: UseOrdemTimerProps): UseOrdemTimerResult {
  const { state, dispatch } = useTimerState({
    ordemId,
    etapa,
    tipoServico,
    isEtapaConcluida
  });
  
  const {
    handleStart,
    handlePause,
    handleResume,
    handleCronometroChange
  } = createTimerHandlers({
    dispatch,
    usarCronometro: state.usarCronometro,
    etapa: etapa as EtapaOS,
    tipoServico: tipoServico as TipoServico,
    onStart,
    onPause,
    onResume,
    onFinish
  });
  
  // Custom handleFinish that calculates totalTime correctly
  const handleFinish = () => {
    if (!state.usarCronometro) {
      onFinish?.(0);
      return;
    }
    
    const finalTime = state.elapsedTime;
    const totalTime = state.totalTime + finalTime;
    
    // Dispatch finish action
    dispatch({ 
      type: "FINISH_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Notify and callback with the total time
    if (onFinish) {
      onFinish(totalTime);
    }
  };
  
  // Calculate total time (saved + current if running)
  const displayTime = state.isRunning ? state.totalTime + state.elapsedTime : state.totalTime;

  return {
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    usarCronometro: state.usarCronometro,
    displayTime,
    totalSavedTime: state.totalTime,
    handleStart,
    handlePause,
    handleResume,
    handleFinish,
    handleCronometroChange,
    pausas: state.pausas
  };
}
