
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
  const handleStart = () => {
    if (!usarCronometro) {
      onStart?.();
      return;
    }
    
    dispatch({ 
      type: "START_TIMER", 
      payload: { now: Date.now() } 
    });
    
    onStart?.();
    
    if (etapa) {
      notifyTimerStarted(etapa as EtapaOS, tipoServico as TipoServico);
    }
  };
  
  const handlePause = (motivo?: string) => {
    if (!usarCronometro) {
      onPause?.();
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
    
    dispatch({ 
      type: "FINISH_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Get the current state after finishing
    const finalTime = 0; // This will be passed from the current state
    const totalTime = 0; // This will be calculated from current + saved time
    
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
