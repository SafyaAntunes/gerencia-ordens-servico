
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalPausedTime: number;
  elapsedTime: number;
  totalTime: number;
  usarCronometro: boolean;
  pausas?: {
    inicio: number;
    fim?: number;
    motivo?: string;
  }[];
}

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
  handleStart: () => void;
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
