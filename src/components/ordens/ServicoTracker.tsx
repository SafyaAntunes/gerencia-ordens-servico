
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Play, Pause, StopCircle, AlarmClock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
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
  
  // Verificar se o usuário tem permissão para este tipo de serviço
  const temPermissao = funcionario?.nivelPermissao === 'admin' || 
                      funcionario?.nivelPermissao === 'gerente' ||
                      (funcionario?.especialidades && funcionario.especialidades.includes(servico.tipo));
  
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

  const subatividadesFiltradas = servico.subatividades?.filter(item => item.selecionada) || [];
  
  const totalSubatividades = subatividadesFiltradas.length || 0;
  const completedSubatividades = subatividadesFiltradas.filter(item => item.concluida).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100)
    : 0;
    
  // Calcular o total de horas estimadas
  const totalHorasEstimadas = subatividadesFiltradas.reduce((total, sub) => {
    return total + (sub.tempoEstimado || 0);
  }, 0);
  
  // Calcular o valor total estimado baseado no preço/hora de cada subatividade
  const valorTotalEstimado = subatividadesFiltradas.reduce((total, sub) => {
    return total + ((sub.precoHora || 0) * (sub.tempoEstimado || 0));
  }, 0);
  
  const getServicoStatus = () => {
    if (servico.concluido) {
      return "concluido";
    } else if (isRunning || isPaused) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  const formatServicoTipo = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem"
    };
    return labels[tipo] || tipo;
  };

  // Verificar se todas as subatividades foram concluídas para marcar o serviço como concluído
  useEffect(() => {
    if (subatividadesFiltradas.length > 0 && 
        subatividadesFiltradas.every(sub => sub.concluida) && 
        !servico.concluido) {
      handleMarcarConcluido();
    }
  }, [subatividadesFiltradas]);

  const handleSubatividadeToggle = (subatividade: SubAtividade) => {
    if (!temPermissao) {
      toast.error("Você não tem permissão para editar este tipo de serviço");
      return;
    }
    
    onSubatividadeToggle(subatividade.id, !subatividade.concluida);
  };
  
  const handlePauseClick = () => {
    if (!temPermissao) {
      toast.error("Você não tem permissão para pausar este tipo de serviço");
      return;
    }
    
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
    
    if (!temPermissao) {
      toast.error("Você não tem permissão para editar este tipo de serviço");
      return;
    }
    
    if (isRunning || isPaused) {
      handleFinish();
    }
    
    onServicoStatusChange(true);
  };
  
  const servicoStatus = getServicoStatus();
  
  // Calcular eficiência: tempo real / tempo estimado (em percentual)
  const tempoEstimadoMs = totalHorasEstimadas * 3600000; // Converter horas para ms
  const eficiencia = tempoEstimadoMs > 0 ? Math.round((displayTime / tempoEstimadoMs) * 100) : 0;

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
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <p>{completedSubatividades} de {totalSubatividades} concluídas</p>
                {totalHorasEstimadas > 0 && (
                  <p className="font-medium flex items-center">
                    <AlarmClock className="h-3 w-3 mr-1" />
                    Estimado: {totalHorasEstimadas.toFixed(1)}h
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {servico.descricao && (
            <CardContent className="pt-0 pb-3">
              <p className="text-sm text-muted-foreground">{servico.descricao}</p>
            </CardContent>
          )}
          
          {/* Resumo do serviço com tempos e valor */}
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/40 p-2 rounded-md">
                <p className="text-muted-foreground">Tempo Estimado</p>
                <p className="font-medium">{totalHorasEstimadas.toFixed(1)} horas</p>
              </div>
              <div className="bg-muted/40 p-2 rounded-md">
                <p className="text-muted-foreground">Tempo Atual</p>
                <p className="font-medium">{(displayTime / 3600000).toFixed(1)} horas</p>
              </div>
              {valorTotalEstimado > 0 && (
                <div className="col-span-2 bg-muted/40 p-2 rounded-md">
                  <p className="text-muted-foreground">Valor Estimado</p>
                  <p className="font-medium">{formatCurrency(valorTotalEstimado)}</p>
                </div>
              )}
              {tempoEstimadoMs > 0 && displayTime > 0 && (
                <div className={cn(
                  "col-span-2 p-2 rounded-md", 
                  eficiencia <= 100 ? "bg-green-100" : "bg-yellow-100"
                )}>
                  <p className={cn(
                    "text-sm",
                    eficiencia <= 100 ? "text-green-800" : "text-yellow-800"
                  )}>
                    Eficiência: {eficiencia <= 100 
                      ? `${(100 - eficiencia).toFixed(0)}% abaixo do estimado (bom)` 
                      : `${(eficiencia - 100).toFixed(0)}% acima do estimado (atenção)`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          
          {subatividadesFiltradas.length > 0 && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {subatividadesFiltradas.map((subatividade) => (
                    <div 
                      key={subatividade.id}
                      className={cn(
                        "flex items-center justify-between",
                        temPermissao ? "cursor-pointer" : "cursor-default"
                      )}
                      onClick={() => temPermissao && handleSubatividadeToggle(subatividade)}
                    >
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {subatividade.tempoEstimado > 0 && (
                          <span>{subatividade.tempoEstimado}h</span>
                        )}
                        {(subatividade.precoHora || 0) > 0 && subatividade.tempoEstimado > 0 && (
                          <span className="font-medium">
                            {formatCurrency((subatividade.precoHora || 0) * (subatividade.tempoEstimado || 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}
          
          {temPermissao && (
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
          )}
          
          {!servico.concluido && temPermissao && (
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
