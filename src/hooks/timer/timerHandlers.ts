
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

// Função auxiliar para validar se uma etapa é válida
const isValidEtapa = (etapa?: EtapaOS): boolean => {
  if (!etapa) return false;
  
  const validEtapas: EtapaOS[] = [
    'lavagem', 
    'inspecao_inicial', 
    'retifica', 
    'montagem', 
    'dinamometro', 
    'inspecao_final'
  ];
  
  return validEtapas.includes(etapa);
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
  
  // Validar os parâmetros mais importantes
  const validateParams = (): boolean => {
    if (!etapa) {
      console.error("timerHandlers: etapa não especificada");
      return false;
    }
    
    if (!isValidEtapa(etapa as EtapaOS)) {
      console.error(`timerHandlers: tipo de etapa inválido: ${etapa}`);
      return false;
    }
    
    return true;
  };
  
  const handleStart = (): boolean => {
    // Log detalhado para debug
    console.log("handleStart chamado em timerHandlers com:", { etapa, tipoServico, usarCronometro });
    
    if (!usarCronometro) {
      console.log("Cronômetro desativado, apenas chamando callback onStart");
      onStart?.();
      return true;
    }
    
    // Validar parâmetros antes de iniciar
    if (!validateParams()) {
      console.error("Não foi possível iniciar o timer: parâmetros inválidos");
      return false;
    }
    
    console.log("Iniciando timer para:", {etapa, tipoServico});
    // Dispatch START_TIMER action com o timestamp atual
    dispatch({ 
      type: "START_TIMER", 
      payload: { now: Date.now() } 
    });
    
    // Chama o callback onStart APÓS iniciar o timer
    if (onStart) {
      console.log("Executando callback onStart");
      onStart();
    }
    
    // Notifica o usuário apenas se a etapa for válida
    if (isValidEtapa(etapa as EtapaOS)) {
      notifyTimerStarted(etapa as EtapaOS, tipoServico as TipoServico);
    }
    
    return true;
  };
  
  const handlePause = (motivo?: string) => {
    console.log("handlePause chamado com motivo:", motivo);
    
    if (!usarCronometro) {
      console.log("Cronômetro desativado, apenas chamando callback onPause");
      onPause?.(motivo);
      return;
    }
    
    if (!validateParams()) {
      console.error("Não foi possível pausar o timer: parâmetros inválidos");
      return;
    }
    
    dispatch({ 
      type: "PAUSE_TIMER", 
      payload: { 
        now: Date.now(),
        motivo
      } 
    });
    
    if (onPause) {
      console.log("Executando callback onPause");
      onPause(motivo);
    }
    
    notifyTimerPaused();
  };
  
  const handleResume = () => {
    console.log("handleResume chamado");
    
    if (!usarCronometro) {
      console.log("Cronômetro desativado, apenas chamando callback onResume");
      onResume?.();
      return;
    }
    
    if (!validateParams()) {
      console.error("Não foi possível retomar o timer: parâmetros inválidos");
      return;
    }
    
    dispatch({ 
      type: "RESUME_TIMER", 
      payload: { now: Date.now() } 
    });
    
    if (onResume) {
      console.log("Executando callback onResume");
      onResume();
    }
    
    notifyTimerResumed();
  };
  
  // O cálculo do tempo total é feito em useOrdemTimer
  const handleFinish = () => {
    console.log("handleFinish chamado");
    
    if (!usarCronometro) {
      console.log("Cronômetro desativado, apenas chamando callback onFinish");
      onFinish?.(0);
      return;
    }
    
    if (!validateParams()) {
      console.error("Não foi possível finalizar o timer: parâmetros inválidos");
      return;
    }
    
    // Dispatch finish action sem calcular o tempo total
    dispatch({ 
      type: "FINISH_TIMER", 
      payload: { now: Date.now() } 
    });
    
    notifyTimerFinished(0);
  };
  
  const handleCronometroChange = (checked: boolean) => {
    console.log("handleCronometroChange chamado com:", checked);
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
