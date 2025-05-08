
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, Play, Pause, StopCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/timerUtils";
import { notifyTimerStarted, notifyTimerPaused, notifyTimerResumed, notifyTimerFinished } from "@/utils/timerNotifications";
import { EtapaOS, SubAtividade, TipoServico } from "@/types/ordens";

interface ServicoProgressoProps {
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  subatividades?: SubAtividade[];
  onComplete: () => void;
  onSubatividadeToggle?: (index: number) => void;
  className?: string;
}

export default function ServicoProgresso({
  etapa,
  tipoServico,
  subatividades = [],
  onComplete,
  onSubatividadeToggle,
  className,
}: ServicoProgressoProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const allCompleted = subatividades.length > 0 && subatividades.every(item => item.selecionada);
  
  // Calculate progress based only on selected subactivities
  const selectedSubatividades = subatividades.filter(sub => sub !== null);
  const completedSubatividades = selectedSubatividades.filter(sub => sub.selecionada);

  const startTimer = () => {
    if (isRunning) return;
    
    const now = Date.now();
    setStartTime(now - elapsedTime);
    setIsRunning(true);
    setIsPaused(false);
    
    const id = window.setInterval(() => {
      setElapsedTime(Date.now() - now + elapsedTime);
    }, 1000);
    
    setIntervalId(id);
    notifyTimerStarted(etapa, tipoServico);
  };

  const pauseTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
    setIsPaused(true);
    notifyTimerPaused();
  };

  const resumeTimer = () => {
    if (isRunning) return;
    
    const now = Date.now();
    setStartTime(now - elapsedTime);
    setIsRunning(true);
    setIsPaused(false);
    
    const id = window.setInterval(() => {
      setElapsedTime(Date.now() - now + elapsedTime);
    }, 1000);
    
    setIntervalId(id);
    notifyTimerResumed();
  };

  const stopTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    setIsRunning(false);
    setIsPaused(false);
    notifyTimerFinished(elapsedTime);
    onComplete();
  };

  const resetTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setStartTime(null);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg text-left">Progresso da Atividade</h3>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      {subatividades.length > 0 && (
        <>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Subatividades</span>
              <span>
                {completedSubatividades.length} de {selectedSubatividades.length} concluídas
              </span>
            </div>
            <div className="space-y-3 text-left">
              {subatividades.map((subatividade, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between"
                  onClick={() => onSubatividadeToggle?.(index)}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <div 
                      className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center",
                        subatividade.selecionada 
                          ? "border-green-500 bg-green-500/10" 
                          : "border-muted"
                      )}
                    >
                      {subatividade.selecionada && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <Badge 
                      variant="outline"
                      className={subatividade.selecionada ? "text-green-600 border-green-600" : "text-muted-foreground"}
                    >
                      {subatividade.nome}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </>
      )}
      
      <CardFooter className="pt-2 flex justify-between">
        <TooltipProvider>
          <div className="flex gap-2">
            {!isRunning && !isPaused && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startTimer}
                    disabled={allCompleted}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Iniciar cronômetro</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {isRunning && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={pauseTimer}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pausar cronômetro</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {isPaused && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resumeTimer}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Continuar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Continuar cronômetro</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {(isRunning || isPaused) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetTimer}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reiniciar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reiniciar cronômetro</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="sm" 
                onClick={stopTimer}
                disabled={!isRunning && !isPaused && elapsedTime === 0}
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Concluir
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Marcar como concluído</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
