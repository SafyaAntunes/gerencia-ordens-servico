
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
  
  const handleFinish = () => {
    if (!usarCronometro) {
      onFinish?.(0);
      return;
    }
    
    // Dispatch finish action
    dispatch({ 
      type: "FINISH_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Calculate the total time (will be done in useOrdemTimer now)
    const totalTime = 0; // This is just a placeholder
    
    notifyTimerFinished(totalTime);
    
    onFinish?.(totalTime);
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
