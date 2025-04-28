
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Servico, SubAtividade } from "@/types/ordens";
import { cn } from "@/lib/utils";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ServicoHeader from "./ServicoHeader";
import ServicoDetails from "./ServicoDetails";
import ServicoControls from "./ServicoControls";
import AtribuirFuncionarioDialog from "./AtribuirFuncionarioDialog";

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
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
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

  const handleSubatividadeToggle = (subatividade: SubAtividade) => {
    if (!temPermissao) {
      toast.error("Você não tem permissão para editar este tipo de serviço");
      return;
    }
    
    onSubatividadeToggle(subatividade.id, !subatividade.concluida);
  };
  
  const handleStartClick = () => {
    if (!temPermissao) {
      toast.error("Você não tem permissão para iniciar este tipo de serviço");
      return;
    }

    if (podeAtribuirFuncionario) {
      setDialogAction('start');
      setAtribuirFuncionarioDialogOpen(true);
    } else {
      handleStart();
    }
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
      setDialogAction('finish');
      setAtribuirFuncionarioDialogOpen(true);
    } else {
      onServicoStatusChange(true, funcionario.id, funcionario.nome);
    }
  };
  
  const handleReiniciarServico = (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
    const funcId = funcionarioSelecionadoId || funcionario?.id;
    const funcNome = funcionarioSelecionadoNome || funcionario?.nome;
    
    if (dialogAction === 'start') {
      // Apenas inicia o timer com o funcionário selecionado
      handleStart();
    } else if (dialogAction === 'finish') {
      // Marca o serviço como concluído com o funcionário selecionado
      onServicoStatusChange(true, funcId, funcNome);
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
          <CardContent className="pt-6">
            <ServicoHeader 
              tipo={servico.tipo}
              displayTime={displayTime}
              servicoStatus={servicoStatus}
              progressPercentage={progressPercentage}
              completedSubatividades={completedSubatividades}
              totalSubatividades={totalSubatividades}
              tempoTotalEstimado={tempoTotalEstimado}
              funcionarioNome={servico.funcionarioNome}
              concluido={servico.concluido}
              temPermissao={temPermissao}
              onToggleOpen={() => setIsOpen(!isOpen)}
              onReiniciarServico={handleReiniciarServico}
            />
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ServicoDetails 
              descricao={servico.descricao}
              subatividades={subatividadesFiltradas}
              temPermissao={temPermissao}
              onSubatividadeToggle={handleSubatividadeToggle}
            />
            
            <ServicoControls 
              isRunning={isRunning}
              isPaused={isPaused}
              temPermissao={temPermissao}
              concluido={servico.concluido}
              onStartClick={handleStartClick}
              onPauseClick={handlePause}
              onResumeClick={handleResume}
              onFinishClick={handleFinish}
              onMarcarConcluido={handleMarcarConcluido}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      <AtribuirFuncionarioDialog 
        isOpen={atribuirFuncionarioDialogOpen}
        onOpenChange={setAtribuirFuncionarioDialogOpen}
        funcionariosOptions={funcionariosOptions}
        funcionarioAtual={{ id: funcionario?.id || "", nome: funcionario?.nome || "" }}
        onFuncionarioChange={handleFuncionarioChange}
        onConfirm={handleConfirmarAtribuicao}
        dialogAction={dialogAction}
      />
    </Card>
  );
}
