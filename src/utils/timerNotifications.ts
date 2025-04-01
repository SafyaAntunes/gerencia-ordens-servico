
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";

/**
 * Show toast notification when timer is started
 */
export const notifyTimerStarted = (etapa: EtapaOS, tipoServico?: TipoServico) => {
  toast.success("Cronômetro iniciado", {
    description: `Medindo tempo para ${etapa}${tipoServico ? ` (${tipoServico})` : ''}`,
  });
};

/**
 * Show toast notification when timer is paused
 */
export const notifyTimerPaused = () => {
  toast.success("Cronômetro pausado", {
    description: "O tempo não está sendo contabilizado",
  });
};

/**
 * Show toast notification when timer is resumed
 */
export const notifyTimerResumed = () => {
  toast.success("Cronômetro retomado", {
    description: "Continuando a medição de tempo",
  });
};

/**
 * Show toast notification when timer is finished
 */
export const notifyTimerFinished = (totalTime: number) => {
  toast.success("Cronômetro finalizado", {
    description: `Tempo total: ${totalTime}`,
  });
};
