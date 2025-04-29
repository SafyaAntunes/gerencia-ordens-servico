
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
    
    console.log("Iniciando timer no timerHandlers");
    dispatch({ 
      type: "START_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Chamada ao callback onStart APÓS iniciar o timer
    onStart?.();
    
    if (etapa) {
      notifyTimerStarted(etapa as EtapaOS, tipoServico as TipoServico);
    }
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
    
    const finalTime = 0; // Este valor virá do estado atual
    
    dispatch({ 
      type: "FINISH_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Obtenha o estado final após finalizar
    const totalTime = 0; // Este valor será calculado a partir do tempo atual + tempo salvo
    
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
