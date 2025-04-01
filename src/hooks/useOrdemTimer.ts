
import { useState, useEffect } from "react";
import { generateTimerStorageKey } from "@/utils/timerUtils";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useToast } from "@/hooks/use-toast";

interface UseOrdemTimerProps {
  ordemId: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalPausedTime: number;
  elapsedTime: number;
  totalSavedTime: number;
  usarCronometro: boolean;
}

export function useOrdemTimer({
  ordemId,
  etapa,
  tipoServico,
  onStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: UseOrdemTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalSavedTime, setTotalSavedTime] = useState(0);
  const [usarCronometro, setUsarCronometro] = useState(true);
  const { toast } = useToast();
  
  // Generate a unique key for localStorage
  const storageKey = generateTimerStorageKey(ordemId, etapa, tipoServico);
  
  // Load saved time from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        
        // If the etapa is completed, just show the total saved time
        if (isEtapaConcluida) {
          setTotalSavedTime(data.totalTime || 0);
          return;
        }
        
        if (data.isRunning) {
          setIsRunning(true);
          setIsPaused(data.isPaused);
          setStartTime(data.startTime);
          setTotalPausedTime(data.totalPausedTime);
          setTotalSavedTime(data.totalTime || 0);
          
          if (data.isPaused) {
            setPauseTime(data.pauseTime);
          }
        } else if (data.totalTime > 0) {
          setTotalSavedTime(data.totalTime);
        }
        
        setUsarCronometro(data.usarCronometro !== undefined ? data.usarCronometro : true);
      } catch (error) {
        console.error("Erro ao carregar dados do cronômetro:", error);
      }
    }
  }, [ordemId, etapa, tipoServico, isEtapaConcluida, storageKey]);
  
  // Save state to localStorage
  useEffect(() => {
    if (isRunning || totalSavedTime > 0) {
      const dataToSave = {
        isRunning,
        isPaused,
        startTime,
        pauseTime,
        totalPausedTime,
        totalTime: totalSavedTime + (isRunning ? elapsedTime : 0),
        usarCronometro
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [isRunning, isPaused, startTime, pauseTime, totalPausedTime, elapsedTime, totalSavedTime, usarCronometro, storageKey]);
  
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
    
    toast({
      title: "Cronômetro iniciado",
      description: `Medindo tempo para ${etapa}${tipoServico ? ` (${tipoServico})` : ''}`,
    });
  };
  
  const handlePause = () => {
    if (!usarCronometro) {
      onPause?.();
      return;
    }
    
    setIsPaused(true);
    setPauseTime(Date.now());
    onPause?.();
    
    toast({
      title: "Cronômetro pausado",
      description: "O tempo não está sendo contabilizado",
    });
  };
  
  const handleResume = () => {
    if (!usarCronometro) {
      onResume?.();
      return;
    }
    
    if (pauseTime) {
      const pauseDuration = Date.now() - pauseTime;
      setTotalPausedTime(prev => prev + pauseDuration);
    }
    setIsPaused(false);
    setPauseTime(null);
    onResume?.();
    
    toast({
      title: "Cronômetro retomado",
      description: "Continuando a medição de tempo",
    });
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
    
    toast({
      title: "Cronômetro finalizado",
      description: `Tempo total: ${totalTime}`,
    });
    
    onFinish?.(totalTime);
    
    // Reset current session
    setStartTime(null);
    setTotalPausedTime(0);
    setElapsedTime(0);
    
    // Save total time to localStorage
    localStorage.setItem(storageKey, JSON.stringify({
      isRunning: false,
      isPaused: false,
      totalTime: totalTime,
      usarCronometro
    }));
  };

  const handleCronometroChange = (checked: boolean) => {
    setUsarCronometro(checked);
    
    // Salve a preferência no localStorage
    const dataToSave = {
      isRunning,
      isPaused,
      startTime,
      pauseTime,
      totalPausedTime,
      totalTime: totalSavedTime + (isRunning ? elapsedTime : 0),
      usarCronometro: checked
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
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
    handleCronometroChange
  };
}
