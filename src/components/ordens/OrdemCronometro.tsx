
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, Clock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
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
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [isRunning, isPaused, startTime, pauseTime, totalPausedTime, elapsedTime, totalSavedTime, storageKey]);
  
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRunning && !isPaused) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const timeElapsed = now - (startTime || 0) - totalPausedTime;
        setElapsedTime(timeElapsed);
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, startTime, totalPausedTime]);
  
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
    setIsPaused(true);
    setPauseTime(Date.now());
    onPause?.();
    
    toast({
      title: "Cronômetro pausado",
      description: "O tempo não está sendo contabilizado",
    });
  };
  
  const handleResume = () => {
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
    }));
  };
  
  // Calculate total time (saved + current if running)
  const displayTime = isRunning ? totalSavedTime + elapsedTime : totalSavedTime;
  
  // If the stage is completed, just show the saved time without controls
  if (isEtapaConcluida) {
    return (
      <Card className="overflow-hidden border border-border/50 bg-white/50 backdrop-blur-sm animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Tempo Registrado</span>
            {tipoServico && (
              <Badge variant="outline">{tipoServicoLabel[tipoServico]}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center py-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/5 mb-3">
            <Clock className="h-10 w-10 text-green-500" />
          </div>
          
          <div className="font-mono text-4xl font-bold">
            {formatTime(totalSavedTime)}
          </div>
          
          <p className="text-sm mt-2 text-green-600 font-medium">
            Etapa concluída
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden border border-border/50 bg-white/50 backdrop-blur-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Controle de Tempo</span>
          {tipoServico && (
            <Badge variant="outline">{tipoServicoLabel[tipoServico]}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-center py-4">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/5 mb-3">
          <Timer className="h-10 w-10 text-primary" />
        </div>
        
        <div className="font-mono text-4xl font-bold">
          {formatTime(displayTime)}
        </div>
        
        <p className="text-sm mt-2 text-muted-foreground">
          {isRunning 
            ? isPaused 
              ? "Cronômetro pausado" 
              : "Cronômetro rodando" 
            : "Cronômetro parado"}
        </p>
        
        {totalSavedTime > 0 && (
          <div className="mt-3 bg-muted/50 rounded-md p-2">
            <p className="text-sm font-medium text-primary">
              Tempo acumulado: {formatTime(totalSavedTime)}
            </p>
            
            {isRunning && !isPaused && (
              <p className="text-xs text-muted-foreground mt-1">
                Tempo atual: {formatTime(elapsedTime)}
              </p>
            )}
          </div>
        )}
      </CardContent>
      
      <Separator />
      
      <CardFooter className="flex justify-between p-4 bg-muted/20">
        {!isRunning && (
          <Button
            onClick={handleStart}
            className="w-full"
            variant="default"
          >
            <Play className="mr-2 h-4 w-4" />
            Iniciar
          </Button>
        )}
        
        {isRunning && !isPaused && (
          <>
            <Button
              onClick={handlePause}
              variant="outline"
              className="flex-1 mr-2"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pausar
            </Button>
            
            <Button
              onClick={handleFinish}
              variant="default"
              className="flex-1"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          </>
        )}
        
        {isRunning && isPaused && (
          <>
            <Button
              onClick={handleResume}
              variant="outline"
              className="flex-1 mr-2"
            >
              <Play className="mr-2 h-4 w-4" />
              Retomar
            </Button>
            
            <Button
              onClick={handleFinish}
              variant="default"
              className="flex-1"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
