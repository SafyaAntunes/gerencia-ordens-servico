
import { useState, useEffect } from "react";
import { generateTimerStorageKey } from "@/utils/timerUtils";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { UseOrdemTimerProps, UseOrdemTimerResult, TimerState } from "@/types/timer";
import { loadTimerData, saveTimerData } from "@/utils/timerStorage";
import { 
  notifyTimerStarted,
  notifyTimerPaused,
  notifyTimerResumed,
  notifyTimerFinished
} from "@/utils/timerNotifications";

export function useOrdemTimer({
  ordemId,
  etapa,
  tipoServico,
  onStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: UseOrdemTimerProps): UseOrdemTimerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalSavedTime, setTotalSavedTime] = useState(0);
  const [usarCronometro, setUsarCronometro] = useState(true);
  const [pausas, setPausas] = useState<{ inicio: number; fim?: number; motivo?: string }[]>([]);
  
  // Generate a unique key for localStorage
  const storageKey = generateTimerStorageKey(ordemId, etapa, tipoServico);
  
  // Load saved time from localStorage
  useEffect(() => {
    const savedData = loadTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico);
    
    if (savedData) {
      // If the etapa is completed, just show the total saved time
      if (isEtapaConcluida) {
        setTotalSavedTime(savedData.totalTime || 0);
        return;
      }
      
      if (savedData.isRunning) {
        setIsRunning(true);
        setIsPaused(savedData.isPaused);
        setStartTime(savedData.startTime);
        setTotalPausedTime(savedData.totalPausedTime);
        setTotalSavedTime(savedData.totalTime || 0);
        
        if (savedData.isPaused) {
          setPauseTime(savedData.pauseTime);
        }
      } else if (savedData.totalTime > 0) {
        setTotalSavedTime(savedData.totalTime);
      }
      
      setUsarCronometro(savedData.usarCronometro !== undefined ? savedData.usarCronometro : true);
      setPausas(savedData.pausas || []);
    }
  }, [ordemId, etapa, tipoServico, isEtapaConcluida]);
  
  // Save state to localStorage
  useEffect(() => {
    if (isRunning || totalSavedTime > 0) {
      const dataToSave: TimerState = {
        isRunning,
        isPaused,
        startTime,
        pauseTime,
        totalPausedTime,
        elapsedTime,
        totalTime: totalSavedTime + (isRunning ? elapsedTime : 0),
        usarCronometro,
        pausas
      };
      
      saveTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico, dataToSave);
    }
  }, [isRunning, isPaused, startTime, pauseTime, totalPausedTime, elapsedTime, totalSavedTime, usarCronometro, pausas, ordemId, etapa, tipoServico]);
  
  // Update timer at regular intervals
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRunning && !isPaused && usarCronometro) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const timeElapsed = now - (startTime || 0) - totalPausedTime;
        setElapsedTime(timeElapsed);
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, startTime, totalPausedTime, usarCronometro]);
  
  const handleStart = () => {
    if (!usarCronometro) {
      onStart?.();
      return;
    }
    
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(Date.now());
    onStart?.();
    
    notifyTimerStarted(etapa as EtapaOS, tipoServico as TipoServico);
  };
  
  const handlePause = (motivo?: string) => {
    if (!usarCronometro) {
      onPause?.();
      return;
    }
    
    const now = Date.now();
    
    setIsPaused(true);
    setPauseTime(now);
    
    // Registra a pausa
    const novaPausa = {
      inicio: now,
      motivo
    };
    
    setPausas(prev => [...prev, novaPausa]);
    
    onPause?.(motivo);
    
    notifyTimerPaused();
  };
  
  const handleResume = () => {
    if (!usarCronometro) {
      onResume?.();
      return;
    }
    
    const now = Date.now();
    
    if (pauseTime) {
      const pauseDuration = now - pauseTime;
      setTotalPausedTime(prev => prev + pauseDuration);
      
      // Atualiza o fim da última pausa
      setPausas(prev => {
        const novasPausas = [...prev];
        if (novasPausas.length > 0) {
          const ultimaPausa = novasPausas[novasPausas.length - 1];
          novasPausas[novasPausas.length - 1] = {
            ...ultimaPausa,
            fim: now
          };
        }
        return novasPausas;
      });
    }
    
    setIsPaused(false);
    setPauseTime(null);
    onResume?.();
    
    notifyTimerResumed();
  };
  
  const handleFinish = () => {
    if (!usarCronometro) {
      onFinish?.(0);
      return;
    }
    
    setIsRunning(false);
    setIsPaused(false);
    const finalTime = elapsedTime;
    // Add current session time to total saved time
    const totalTime = totalSavedTime + finalTime;
    setTotalSavedTime(totalTime);
    
    notifyTimerFinished(totalTime);
    
    onFinish?.(totalTime);
    
    // Reset current session
    setStartTime(null);
    setTotalPausedTime(0);
    setElapsedTime(0);
    
    // Save total time to localStorage
    const dataToSave: TimerState = {
      isRunning: false,
      isPaused: false,
      startTime: null,
      pauseTime: null,
      totalPausedTime: 0,
      elapsedTime: 0,
      totalTime,
      usarCronometro,
      pausas
    };
    
    saveTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico, dataToSave);
  };

  const handleCronometroChange = (checked: boolean) => {
    setUsarCronometro(checked);
    
    // Save preference to localStorage
    const dataToSave: TimerState = {
      isRunning,
      isPaused,
      startTime,
      pauseTime,
      totalPausedTime,
      elapsedTime,
      totalTime: totalSavedTime + (isRunning ? elapsedTime : 0),
      usarCronometro: checked,
      pausas
    };
    
    saveTimerData(ordemId, etapa as EtapaOS, tipoServico as TipoServico, dataToSave);
  };
  
  // Calculate total time (saved + current if running)
  const displayTime = isRunning ? totalSavedTime + elapsedTime : totalSavedTime;

  return {
    isRunning,
    isPaused, 
    usarCronometro,
    displayTime,
    totalSavedTime,
    handleStart,
    handlePause,
    handleResume,
    handleFinish,
    handleCronometroChange,
    pausas
  };
}
