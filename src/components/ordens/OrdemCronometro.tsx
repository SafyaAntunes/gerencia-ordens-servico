
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, Clock } from "lucide-react";
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
}: OrdemCronometroProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();
  
  // Load saved time from localStorage
  useEffect(() => {
    const key = `cronometro-${ordemId}-${etapa}${tipoServico ? `-${tipoServico}` : ''}`;
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.isRunning) {
          setIsRunning(true);
          setIsPaused(data.isPaused);
          setStartTime(data.startTime);
          setTotalPausedTime(data.totalPausedTime);
          
          if (data.isPaused) {
            setPauseTime(data.pauseTime);
          }
        } else if (data.elapsedTime > 0) {
          setElapsedTime(data.elapsedTime);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do cronômetro:", error);
      }
    }
  }, [ordemId, etapa, tipoServico]);
  
  // Save state to localStorage
  useEffect(() => {
    if (isRunning || elapsedTime > 0) {
      const key = `cronometro-${ordemId}-${etapa}${tipoServico ? `-${tipoServico}` : ''}`;
      const dataToSave = {
        isRunning,
        isPaused,
        startTime,
        pauseTime,
        totalPausedTime,
        elapsedTime: isRunning ? elapsedTime : elapsedTime,
      };
      
      localStorage.setItem(key, JSON.stringify(dataToSave));
    }
  }, [isRunning, isPaused, startTime, pauseTime, totalPausedTime, elapsedTime, ordemId, etapa, tipoServico]);
  
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
    
    toast({
      title: "Cronômetro finalizado",
      description: `Tempo total: ${formatTime(finalTime)}`,
    });
    
    onFinish?.(finalTime);
    
    // Reset cronômetro
    setStartTime(null);
    setTotalPausedTime(0);
    setElapsedTime(0);
    
    // Remove from localStorage
    const key = `cronometro-${ordemId}-${etapa}${tipoServico ? `-${tipoServico}` : ''}`;
    localStorage.removeItem(key);
  };
  
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
