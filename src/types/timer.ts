
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalPausedTime: number;
  elapsedTime: number;
  totalTime: number;
  usarCronometro: boolean;
  pausas: {
    inicio: number;
    fim?: number;
    motivo?: string;
  }[];
}
