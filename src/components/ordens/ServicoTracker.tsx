
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/timerUtils";
import { Servico, SubAtividade, TipoServico } from "@/types/ordens";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ServicoTrackerProps {
  servico: Servico;
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean) => void;
  className?: string;
}

export default function ServicoTracker({
  servico,
  onSubatividadeToggle,
  onServicoStatusChange,
  className,
}: ServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Calculate progress percentage
  const totalSubatividades = servico.subatividades?.length || 0;
  const completedSubatividades = servico.subatividades?.filter(item => item.selecionada).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100)
    : 0;

  const allCompleted = totalSubatividades > 0 && completedSubatividades === totalSubatividades;

  // Format the service type for display
  const formatServicoTipo = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem"
    };
    return labels[tipo] || tipo;
  };

  // Toggle a subatividade
  const handleSubatividadeToggle = (subatividade: SubAtividade) => {
    onSubatividadeToggle(servico.tipo, subatividade.id, !subatividade.selecionada);
  };

  // Complete the service
  const handleComplete = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setIsRunning(false);
    }
    onServicoStatusChange(servico.tipo, true);
  };

  // Start or stop timer
  const toggleTimer = () => {
    if (isRunning) {
      // Stop timer
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setIsRunning(false);
    } else {
      // Start timer
      const id = window.setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);
      setIntervalId(id);
      setIsRunning(true);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">
                  {formatServicoTipo(servico.tipo)}
                </h3>
                {servico.concluido && (
                  <Badge variant="success" className="ml-2">Concluído</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-right mt-1 text-muted-foreground">
                {completedSubatividades} de {totalSubatividades} concluídas
              </p>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {servico.descricao && (
            <CardContent className="pt-0 pb-3">
              <p className="text-sm text-muted-foreground">{servico.descricao}</p>
            </CardContent>
          )}
          
          {servico.subatividades && servico.subatividades.length > 0 && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {servico.subatividades.map((subatividade) => (
                    <div 
                      key={subatividade.id}
                      className="flex items-center justify-between"
                      onClick={() => handleSubatividadeToggle(subatividade)}
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTimer}
              disabled={servico.concluido}
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Pausar Timer
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Iniciar Timer
                </>
              )}
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleComplete}
              disabled={servico.concluido}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar Concluído
            </Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
