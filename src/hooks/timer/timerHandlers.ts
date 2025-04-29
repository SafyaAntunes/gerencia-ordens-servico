
import { EtapaOS, TipoServico } from "@/types/ordens";
import { 
  notifyTimerStarted,
  notifyTimerPaused,
  notifyTimerResumed,
  notifyTimerFinished
} from "@/utils/timerNotifications";
import { TimerAction } from "./timerReducer";

type TimerHandlerProps = {
  dispatch: React.Dispatch<TimerAction>;
  usarCronometro: boolean;
  etapa?: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
};

export const createTimerHandlers = ({
  dispatch,
  usarCronometro,
  etapa,
  tipoServico,
  onStart,
  onPause,
  onResume,
  onFinish
}: TimerHandlerProps) => {
  const handleStart = (): boolean => {
    if (!usarCronometro) {
      onStart?.();
      return true;
    }
    
    console.log("Iniciando timer no timerHandlers para:", {etapa, tipoServico});
    // Dispatch START_TIMER action with the current timestamp
    dispatch({ 
      type: "START_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Chamada ao callback onStart APÓS iniciar o timer
    onStart?.();
    
    if (etapa) {
      notifyTimerStarted(etapa as EtapaOS, tipoServico as TipoServico);
    }
    
    return true;
  };
  
  const handlePause = (motivo?: string) => {
    if (!usarCronometro) {
      onPause?.(motivo);
      return;
    }
    
    dispatch({ 
      type: "PAUSE_TIMER", 
      payload: { 
        now: Date.now(),
        motivo
      } 
    });
    
    onPause?.(motivo);
    
    notifyTimerPaused();
  };
  
  const handleResume = () => {
    if (!usarCronometro) {
      onResume?.();
      return;
    }
    
    dispatch({ 
      type: "RESUME_TIMER", 
      payload: { now: Date.now() } 
    });
    
    onResume?.();
    
    notifyTimerResumed();
  };
  
  // Let useOrdemTimer handle the finish calculation, here we just
  // dispatch the action and call the callback
  const handleFinish = () => {
    if (!usarCronometro) {
      onFinish?.(0);
      return;
    }
    
    // Dispatch finish action but without calculating the total time
    // This will be done in useOrdemTimer
    dispatch({ 
      type: "FINISH_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // The total time is handled in useOrdemTimer, not here
    notifyTimerFinished(0);
  };
  
  const handleCronometroChange = (checked: boolean) => {
    dispatch({ 
      type: "TOGGLE_CRONOMETRO", 
      payload: { useCronometro: checked } 
    });
  };
  
  return {
    handleStart,
    handlePause,
    handleResume,
    handleFinish,
    handleCronometroChange
  };
};
