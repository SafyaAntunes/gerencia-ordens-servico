
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

const tipoServicoLabel: Record<string, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando"
};

export default function OrdemCronometro({
  ordemId,
  funcionarioId,
  funcionarioNome = "João Silva", // Valor padrão para demonstração
  etapa,
  tipoServico,
  onStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: OrdemCronometroProps) {
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
  const storageKey = `cronometro-${ordemId}-${etapa}${tipoServico ? `-${tipoServico}` : ''}`;
  
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
  
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };
  
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
      description: `Medindo tempo para ${etapa}${tipoServico ? ` (${tipoServicoLabel[tipoServico]})` : ''}`,
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
      description: `Tempo total: ${formatTime(totalTime)}`,
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
  
  // If the stage is completed, just show the saved time without controls
  if (isEtapaConcluida) {
    return (
      <div className="w-full">
        <div className="text-right font-mono text-2xl font-bold">
          {formatTime(totalSavedTime)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Funcionário responsável */}
      <div className="mb-2 text-sm">{funcionarioNome}</div>
      
      {/* Tempo no formato hh:mm:ss */}
      <div className="text-right font-mono text-4xl font-bold mb-3">
        {formatTime(displayTime)}
      </div>
      
      <div className="flex gap-2 mb-3">
        {!isRunning && (
          <Button
            onClick={handleStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!usarCronometro && !onStart}
          >
            <Play className="mr-2 h-4 w-4" /> Iniciar
          </Button>
        )}
        
        {isRunning && !isPaused && (
          <Button
            onClick={handlePause}
            variant="outline"
            className="w-full"
            disabled={!usarCronometro && !onPause}
          >
            <Pause className="mr-2 h-4 w-4" /> Pausar
          </Button>
        )}
        
        {isRunning && isPaused && (
          <Button
            onClick={handleResume}
            variant="outline"
            className="w-full"
            disabled={!usarCronometro && !onResume}
          >
            <Play className="mr-2 h-4 w-4" /> Retomar
          </Button>
        )}
        
        {isRunning && (
          <Button
            onClick={handleFinish}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!usarCronometro && !onFinish}
          >
            <StopCircle className="mr-2 h-4 w-4" /> Terminar
          </Button>
        )}
      </div>
      
      {/* Opção de usar cronômetro */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`usar-cronometro-${ordemId}-${etapa}`}
          checked={usarCronometro}
          onCheckedChange={handleCronometroChange}
        />
        <label 
          htmlFor={`usar-cronometro-${ordemId}-${etapa}`}
          className="text-sm font-medium leading-none cursor-pointer"
        >
          Usar cronômetro
        </label>
      </div>
    </div>
  );
}
