import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";
import { Servico, SubAtividade } from "@/types/ordens";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { toast } from "sonner";

// Define the ServiceStatus type to ensure consistency
export type ServicoStatus = "concluido" | "em_andamento" | "nao_iniciado";

interface UseServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  etapa?: string;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}

export function useServicoTracker({
  servico,
  ordemId,
  funcionarioId = "",
  funcionarioNome,
  etapa = "",
  onServicoStatusChange,
  onSubatividadeToggle
}: UseServicoTrackerProps) {
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

  const handleLoadFuncionarios = () => {
    if (podeAtribuirFuncionario) {
      carregarFuncionarios();
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

    const subatividadesFiltradas = servico.subatividades?.filter(item => item.selecionada) || [];
    const totalSubatividades = subatividadesFiltradas.length || 0;
    const completedSubatividades = subatividadesFiltradas.filter(item => item.concluida).length || 0;
    const todasSubatividadesConcluidas = totalSubatividades > 0 && completedSubatividades === totalSubatividades;

    if (totalSubatividades > 0 && !todasSubatividadesConcluidas) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar o serviço");
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
      // Explicitamente iniciar o timer após a confirmação do funcionário
      console.log("Iniciando timer após atribuição de funcionário");
      handleStart();
      
      // O erro estava aqui. Não podemos testar o retorno de handleStart()
      // já que ele não retorna um valor booleano
    } else if (dialogAction === 'finish') {
      const subatividadesFiltradas = servico.subatividades?.filter(item => item.selecionada) || [];
      const totalSubatividades = subatividadesFiltradas.length || 0;
      const completedSubatividades = subatividadesFiltradas.filter(item => item.concluida).length || 0;
      const todasSubatividadesConcluidas = totalSubatividades > 0 && completedSubatividades === totalSubatividades;
      
      if (totalSubatividades > 0 && !todasSubatividadesConcluidas) {
        toast.error("É necessário concluir todas as subatividades antes de finalizar o serviço");
        setAtribuirFuncionarioDialogOpen(false);
        return;
      }
      
      onServicoStatusChange(true, funcId, funcNome);
    }
    
    setAtribuirFuncionarioDialogOpen(false);
  };
  
  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  // Calculated values
  const subatividadesFiltradas = servico.subatividades?.filter(item => item.selecionada) || [];
  const totalSubatividades = subatividadesFiltradas.length || 0;
  const completedSubatividades = subatividadesFiltradas.filter(item => item.concluida).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100)
    : 0;
  const todasSubatividadesConcluidas = totalSubatividades > 0 && completedSubatividades === totalSubatividades;
  
  const tempoTotalEstimado = subatividadesFiltradas.reduce((total, sub) => {
    return total + (sub.tempoEstimado || 0);
  }, 0);
    
  const getServicoStatus = (): ServicoStatus => {
    if (servico.concluido) {
      return "concluido";
    } else if (isRunning || isPaused) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  const servicoStatus = getServicoStatus();

  return {
    isOpen,
    setIsOpen,
    funcionariosOptions,
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    temPermissao,
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido,
    handleReiniciarServico,
    handleConfirmarAtribuicao,
    handleFuncionarioChange,
    funcionarioSelecionadoId
  };
}
