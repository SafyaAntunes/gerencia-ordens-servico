
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, Timer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  etapa: string;
  onSave?: (tempoRegistro: {
    inicio: Date;
    fim?: Date;
    duracao: number;
    etapa: string;
  }) => void;
}

export default function OrdemCronometro({ 
  ordemId, 
  funcionarioId, 
  etapa,
  onSave 
}: OrdemCronometroProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    if (!startTime) {
      setStartTime(new Date());
    }
    
    toast({
      title: "Cronômetro iniciado",
      description: `Registrando tempo para a etapa: ${etapa}`,
    });
  };

  const handlePause = () => {
    setIsRunning(false);
    toast({
      title: "Cronômetro pausado",
      description: "O tempo será preservado para continuar depois",
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    
    // Armazenar os dados do tempo registrado
    if (startTime && onSave) {
      const endTime = new Date();
      const duration = time; // em milissegundos
      
      onSave({
        inicio: startTime,
        fim: endTime,
        duracao: duration,
        etapa: etapa,
      });
      
      toast({
        title: "Tempo finalizado e salvo",
        description: `Etapa: ${etapa} - Duração: ${formatTime(time)}`,
      });
    }
    
    // Resetar o cronômetro
    setTime(0);
    setStartTime(null);
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Timer className="w-5 h-5 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">{etapa}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="font-mono text-lg font-medium mr-2">
              {formatTime(time)}
            </div>
            
            {!isRunning ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStart}
                className="h-8 px-2"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePause}
                className="h-8 px-2"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleStop}
              disabled={!startTime}
              className="h-8 px-2"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
            
            {onSave && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleStop}
                disabled={!startTime}
                className="h-8 px-2"
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
