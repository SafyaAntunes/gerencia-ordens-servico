
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  etapa: string;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
}

export default function OrdemCronometro({
  ordemId,
  funcionarioId,
  etapa,
  onStart,
  onPause,
  onResume,
  onFinish,
}: OrdemCronometroProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
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
  };
  
  const handlePause = () => {
    setIsPaused(true);
    setPauseTime(Date.now());
    onPause?.();
  };
  
  const handleResume = () => {
    if (pauseTime) {
      const pauseDuration = Date.now() - pauseTime;
      setTotalPausedTime(prev => prev + pauseDuration);
    }
    setIsPaused(false);
    setPauseTime(null);
    onResume?.();
  };
  
  const handleFinish = () => {
    setIsRunning(false);
    setIsPaused(false);
    onFinish?.(elapsedTime);
    
    // Reset cronômetro
    setStartTime(null);
    setTotalPausedTime(0);
    setElapsedTime(0);
  };
  
  return (
    <Card className="overflow-hidden border border-border/50 bg-white/50 backdrop-blur-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Controle de Tempo</CardTitle>
      </CardHeader>
      
      <CardContent className="text-center py-4">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/5 mb-3">
          <Clock className="h-10 w-10 text-primary" />
        </div>
        
        <div className="font-mono text-4xl font-bold">
          {formatTime(elapsedTime)}
        </div>
        
        <p className="text-sm mt-2 text-muted-foreground">
          {isRunning 
            ? isPaused 
              ? "Cronômetro pausado" 
              : "Cronômetro rodando" 
            : "Cronômetro parado"}
        </p>
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
