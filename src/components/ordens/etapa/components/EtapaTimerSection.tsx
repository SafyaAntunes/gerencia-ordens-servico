
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, StopCircle } from "lucide-react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";

interface EtapaTimerSectionProps {
  etapa: EtapaOS;
  ordemId: string;
  servicoTipo?: TipoServico;
  etapaInfo?: any;
  disabled?: boolean;
}

export function EtapaTimerSection({ 
  etapa,
  ordemId,
  servicoTipo,
  etapaInfo,
  disabled = false
}: EtapaTimerSectionProps) {
  // Use the useOrdemTimer hook directly
  const {
    isRunning,
    isPaused,
    displayTime,
    handleStart: startTimer,
    handlePause: pauseTimer,
    handleResume: resumeTimer,
    handleFinish: stopTimer
  } = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico: servicoTipo,
    isEtapaConcluida: etapaInfo?.concluido || false
  });

  const canStart = !isRunning && !isPaused && !disabled;
  const canPause = isRunning && !isPaused && !disabled;
  const canResume = !isRunning && isPaused && !disabled;
  const canStop = (isRunning || isPaused) && !disabled;

  const handleStartClick = () => {
    return startTimer();
  };

  const handlePauseClick = () => {
    pauseTimer();
    return true;
  };

  const handleResumeClick = () => {
    resumeTimer();
    return true;
  };

  const handleStopClick = () => {
    stopTimer();
    return true;
  };

  return (
    <div className="bg-muted/40 p-4 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-2xl font-mono">{displayTime}</div>
        
        <div className="flex flex-wrap gap-2">
          {canStart && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleStartClick}
              disabled={disabled}
            >
              <Play className="mr-1 h-4 w-4" />
              Iniciar
            </Button>
          )}
          
          {canPause && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePauseClick}
              disabled={disabled}
            >
              <Pause className="mr-1 h-4 w-4" />
              Pausar
            </Button>
          )}
          
          {canResume && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleResumeClick}
              disabled={disabled}
            >
              <Play className="mr-1 h-4 w-4" />
              Continuar
            </Button>
          )}
          
          {canStop && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleStopClick}
              disabled={disabled}
            >
              <StopCircle className="mr-1 h-4 w-4" />
              Parar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
