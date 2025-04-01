
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalPausedTime: number;
  elapsedTime: number;
  totalTime: number;
  usarCronometro: boolean;
}

export interface UseOrdemTimerProps {
  ordemId: string;
  etapa: string;
  tipoServico?: string;
  onStart?: () => void;
  onPause?: () => void;
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
  handlePause: () => void;
  handleResume: () => void;
  handleFinish: () => void;
  handleCronometroChange: (checked: boolean) => void;
}
