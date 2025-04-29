
import { EtapaOS, TipoServico } from "@/types/ordens";

export interface UseOrdemTimerProps {
  ordemId: string;
  etapa: string;
  tipoServico?: string;
  onStart?: () => void;
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export interface UseOrdemTimerResult {
  isRunning: boolean;
  isPaused: boolean;
  usarCronometro: boolean;
  displayTime: number;
  totalSavedTime: number;
  handleStart: () => boolean;
  handlePause: (motivo?: string) => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleCronometroChange: (checked: boolean) => void;
  pausas: {
    inicio: number;
    fim?: number;
    motivo?: string;
  }[];
}
