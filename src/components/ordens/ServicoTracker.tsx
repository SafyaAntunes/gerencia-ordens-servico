import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  StopCircle, 
  Clock4,
  User,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/timerUtils";
import { Servico, SubAtividade, TipoServico } from "@/types/ordens";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PausaDialog from "./PausaDialog";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  className?: string;
  etapa?: string;
}

export default function ServicoTracker({
  servico,
  ordemId = "",
  funcionarioId = "",
  funcionarioNome,
  onSubatividadeToggle,
  onServicoStatusChange,
  className,
  etapa,
}: ServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pausaDialogOpen, setPausaDialogOpen] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const { funcionario } = useAuth();
  
  const temPermissao = funcionario?.nivelPermissao === 'admin' || 
                      funcionario?.nivelPermissao === 'gerente' ||
                      (funcionario?.especialidades && funcionario.especialidades.includes(servico.tipo));
  
  const podeAtribuirFuncionario = funcionario?.nivelPermissao === 'admin' || 
                                 funcionario?.nivelPermissao === 'gerente';
  
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
    etapa: etapa || 'retifica',
    tipoServico: servico.tipo,
    onFinish: () => {/* Removed auto-completion */},
    isEtapaConcluida: servico.concluido
  });

  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosRef = collection(db, "funcionarios");
        const snapshot = await getDocs(funcionariosRef);
        const funcionarios: Funcionario[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Funcionario;
          funcionarios.push({
            ...data,
            id: doc.id
          });
        });
        
        setFuncionariosOptions(funcionarios);
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };
    
    if (podeAtribuirFuncionario) {
      carregarFuncionarios();
    }
  }, [podeAtribuirFuncionario]);

  const subatividadesFiltradas = servico.subatividades?.filter(item => item.selecionada) || [];
  
  const totalSubatividades = subatividadesFiltradas.length || 0;
  const completedSubatividades = subatividadesFiltradas.filter(item => item.concluida).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100)
    : 0;
  
  const tempoTotalEstimado = subatividadesFiltradas.reduce((total, sub) => {
    return total + (sub.tempoEstimado || 0);
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
    
    if (podeAtribuirFuncionario) {
      setAtribuirFuncionarioDialogOpen(true);
    } else {
      onServicoStatusChange(true, funcionario.id, funcionario.nome);
    }
  };
  
  const handleReiniciarServico = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para reiniciar um serviço");
      return;
    }
    
    if (!temPermissao) {
      toast.error("Você não tem permissão para reiniciar este tipo de serviço");
      return;
    }
    
    onServicoStatusChange(false, servico.funcionarioId, servico.funcionarioNome);
    toast.success("Serviço reaberto para continuação");
  };
  
  const handleConfirmarAtribuicao = () => {
    if (funcionarioSelecionadoId) {
      onServicoStatusChange(true, funcionarioSelecionadoId, funcionarioSelecionadoNome);
    } else {
      onServicoStatusChange(true, funcionario?.id, funcionario?.nome);
    }
    setAtribuirFuncionarioDialogOpen(false);
  };

  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
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
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {completedSubatividades} de {totalSubatividades} concluídas
                </p>
                {tempoTotalEstimado > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock4 className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {tempoTotalEstimado} {tempoTotalEstimado === 1 ? 'hora' : 'horas'} estimadas
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {servico.concluido && servico.funcionarioNome && (
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <User className="h-3 w-3 mr-1" />
                <span>Concluído por: {servico.funcionarioNome}</span>
                
                {temPermissao && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-blue-500 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReiniciarServico();
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reiniciar
                  </Button>
                )}
              </div>
            )}
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
                      {subatividade.tempoEstimado && (
                        <span className="text-xs text-muted-foreground">
                          {subatividade.tempoEstimado} {subatividade.tempoEstimado === 1 ? 'hora' : 'horas'}
                        </span>
                      )}
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
      
      <Dialog open={atribuirFuncionarioDialogOpen} onOpenChange={setAtribuirFuncionarioDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atribuir Funcionário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="funcionario-select" className="block text-sm font-medium">
                Selecione o funcionário que executou o serviço
              </label>
              
              <Select onValueChange={handleFuncionarioChange} value={funcionarioSelecionadoId}>
                <SelectTrigger id="funcionario-select" className="w-full">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={funcionario?.id || ""}>
                    {funcionario?.nome || "Eu mesmo"} (você)
                  </SelectItem>
                  {funcionariosOptions
                    .filter(f => f.id !== funcionario?.id)
                    .map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtribuirFuncionarioDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarAtribuicao} className="bg-blue-500 hover:bg-blue-600">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
