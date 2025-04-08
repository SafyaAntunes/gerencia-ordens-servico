
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Play, Pause, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/timerUtils";
import { Servico, SubAtividade, TipoServico } from "@/types/ordens";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PausaDialog from "./PausaDialog";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (concluido: boolean) => void;
  className?: string;
}

export default function ServicoTracker({
  servico,
  ordemId = "",
  funcionarioId = "",
  funcionarioNome,
  onSubatividadeToggle,
  onServicoStatusChange,
  className,
}: ServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pausaDialogOpen, setPausaDialogOpen] = useState(false);
  const { funcionario } = useAuth();
  
  const {
    isRunning,
    isPaused,
    usarCronometro,
    displayTime,
    handleStart,
    handlePause,
    handleResume,
    handleFinish
  } = useOrdemTimer({
    ordemId,
    etapa: 'retifica',
    tipoServico: servico.tipo,
    onFinish: () => {/* Removed auto-completion */},
    isEtapaConcluida: servico.concluido
  });

  // Filtramos apenas as subatividades selecionadas durante a criação da OS
  const subatividadesFiltradas = servico.subatividades?.filter(item => item.selecionada) || [];
  
  // Calculate progress percentage apenas das selecionadas
  const totalSubatividades = subatividadesFiltradas.length || 0;
  const completedSubatividades = subatividadesFiltradas.filter(item => item.concluida).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100)
    : 0;
    
  // Verificar se todas as subatividades estão concluídas
  const allCompleted = totalSubatividades > 0 && completedSubatividades === totalSubatividades;
  
  // Determinar o status do serviço
  const getServicoStatus = () => {
    if (servico.concluido) {
      return "concluido";
    } else if (isRunning || isPaused) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  // Format the service type for display
  const formatServicoTipo = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro"
    };
    return labels[tipo] || tipo;
  };

  // Toggle a subatividade
  const handleSubatividadeToggle = (subatividade: SubAtividade) => {
    onSubatividadeToggle(subatividade.id, !subatividade.concluida);
  };
  
  const handlePauseClick = () => {
    setPausaDialogOpen(true);
  };
  
  const handlePausaConfirm = (motivo: string) => {
    handlePause(motivo);
    setPausaDialogOpen(false);
  };

  const handlePausaCancel = () => {
    setPausaDialogOpen(false);
  };
  
  const handleMarcarConcluido = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar um serviço");
      return;
    }
    
    if (isRunning || isPaused) {
      handleFinish();
    }
    
    onServicoStatusChange(true);
  };
  
  useEffect(() => {
    // Se todas as subatividades estiverem concluídas, marcar o serviço como concluído automaticamente
    if (allCompleted && !servico.concluido) {
      onServicoStatusChange(true);
    }
  }, [allCompleted, servico.concluido, onServicoStatusChange]);

  const servicoStatus = getServicoStatus();

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
                {servicoStatus === "concluido" && (
                  <Badge variant="success" className="ml-2">Concluído</Badge>
                )}
                {servicoStatus === "em_andamento" && (
                  <Badge variant="outline" className="ml-2">Em andamento</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {formatTime(displayTime)}
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
          
          {subatividadesFiltradas.length > 0 && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {subatividadesFiltradas.map((subatividade) => (
                    <div 
                      key={subatividade.id}
                      className="flex items-center justify-between"
                      onClick={() => handleSubatividadeToggle(subatividade)}
                    >
                      <div className="flex items-center gap-2 cursor-pointer">
                        <div 
                          className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center",
                            subatividade.concluida 
                              ? "border-green-500 bg-green-500/10" 
                              : "border-muted"
                          )}
                        >
                          {subatividade.concluida && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <Badge 
                          variant="outline"
                          className={subatividade.concluida ? "text-green-600 border-green-600" : "text-muted-foreground"}
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
          
          <CardContent className="py-3">
            <div className="flex space-x-2 my-2">
              {!isRunning && !isPaused && !servico.concluido && (
                <Button
                  onClick={handleStart}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar Timer
                </Button>
              )}
              
              {isRunning && !isPaused && (
                <Button
                  onClick={handlePauseClick}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
              )}
              
              {isPaused && (
                <Button
                  onClick={handleResume}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Retomar
                </Button>
              )}
              
              {(isRunning || isPaused) && (
                <Button
                  onClick={handleFinish}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Terminar
                </Button>
              )}
            </div>
          </CardContent>
          
          {!servico.concluido && (
            <CardFooter className="pt-0 pb-4">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleMarcarConcluido}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marcar Concluído
              </Button>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
      
      <PausaDialog 
        isOpen={pausaDialogOpen}
        onClose={handlePausaCancel}
        onConfirm={handlePausaConfirm}
      />
    </Card>
  );
}
