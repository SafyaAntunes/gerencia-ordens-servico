
import { useState, useEffect, useCallback } from "react";

export interface UseServicoTimerResult {
  isRunning: boolean;
  isPaused: boolean;
  displayTime: string;
  elapsedSeconds: number;
  startTime: number | null;
  pauseTime: number | null;
  pausas: { inicio: number; fim?: number }[];
  setIsRunning: (value: boolean) => void;
  setIsPaused: (value: boolean) => void;
  setDisplayTime: (value: string) => void;
  setElapsedSeconds: (value: number) => void;
  setStartTime: (value: number | null) => void;
  setPauseTime: (value: number | null) => void;
  setPausas: React.Dispatch<React.SetStateAction<{ inicio: number; fim?: number }[]>>;
  handleStartClick: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleFinish: () => void;
}

export function useServicoTimer(): UseServicoTimerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [pausas, setPausas] = useState<{ inicio: number; fim?: number }[]>([]);

  const handleStartClick = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now() - (pauseTime ? pauseTime - (startTime || Date.now()) : 0));
    setPauseTime(null);
  }, [startTime, pauseTime]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    setPauseTime(Date.now());
    setPausas(prevPausas => [...prevPausas, { inicio: Date.now() }]);
  }, []);

  const handleResume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now() - (pauseTime ? pauseTime - (startTime || Date.now()) : 0));
    setPauseTime(null);
    setPausas(prevPausas => {
      const lastPause = prevPausas[prevPausas.length - 1];
      if (lastPause && !lastPause.fim) {
        return prevPausas.map((p, i) => i === prevPausas.length - 1 ? { ...p, fim: Date.now() } : p);
      }
      return prevPausas;
    });
  }, [startTime, pauseTime]);

  const handleFinish = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setPauseTime(null);
    setDisplayTime("00:00:00");
    setElapsedSeconds(0);
  }, []);

  // Timer effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && startTime !== null) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        const seconds = Math.floor(diff / 1000);
        setElapsedSeconds(seconds);

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        setDisplayTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, startTime]);

  return {
    isRunning,
    isPaused,
    displayTime,
    elapsedSeconds,
    startTime,
    pauseTime,
    pausas,
    setIsRunning,
    setIsPaused,
    setDisplayTime,
    setElapsedSeconds,
    setStartTime,
    setPauseTime,
    setPausas,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish
  };
}
