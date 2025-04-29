
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Funcionario } from "@/types/funcionarios";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";

export function useEtapaCard(etapa: EtapaOS, servicoTipo?: TipoServico) {
  const [isAtivo, setIsAtivo] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  const { funcionario } = useAuth();
  
  // Verificar se o usuário tem permissão para atribuir funcionários
  const podeAtribuirFuncionario = funcionario?.nivelPermissao === 'admin' || 
                                 funcionario?.nivelPermissao === 'gerente';
  
  const podeTrabalharNaEtapa = () => {
    if (funcionario?.nivelPermissao === 'admin' || 
        funcionario?.nivelPermissao === 'gerente') {
      return true;
    }
    
    if (etapa === 'lavagem') {
      return funcionario?.especialidades?.includes('lavagem');
    }
    
    if (etapa === 'inspecao_inicial' || etapa === 'inspecao_final') {
      if (servicoTipo) {
        return funcionario?.especialidades?.includes(servicoTipo);
      }
      return false;
    }
    
    if (servicoTipo) {
      return funcionario?.especialidades?.includes(servicoTipo);
    }
    
    return funcionario?.especialidades?.includes(etapa);
  };
  
  // Verificação para determinar se o usuário pode reabrir uma atividade já concluída
  const podeReabrirAtividade = () => {
    // Apenas administradores podem reabrir atividades
    return funcionario?.nivelPermissao === 'admin';
  };
  
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData && funcionariosData.length > 0) {
          setFuncionariosOptions(funcionariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };
    
    carregarFuncionarios();
  }, []);
  
  const handleIniciarTimer = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para iniciar uma etapa");
      return false;
    }

    if (podeAtribuirFuncionario) {
      setDialogAction('start');
      setAtribuirFuncionarioDialogOpen(true);
      return false;
    }
    
    // Próprio usuário inicia o timer
    return handleTimerStart();
  };
  
  const handleTimerStart = () => {
    console.log("handleTimerStart chamado em useEtapaCard");
    setIsAtivo(true);
    return true; // Indicate success
  };
  
  const handleMarcarConcluido = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return false;
    }

    if (podeAtribuirFuncionario) {
      setDialogAction('finish');
      setAtribuirFuncionarioDialogOpen(true);
      return false;
    }
    
    return true;
  };
  
  const isEtapaConcluida = (etapaInfo: any) => {
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    return etapaInfo?.concluido;
  };
  
  const getEtapaStatus = (etapaInfo: any) => {
    if (isEtapaConcluida(etapaInfo)) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  const handleReiniciarEtapa = (onEtapaStatusChange: any) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para reiniciar uma etapa");
      return;
    }
    
    // Verificar se o usuário é administrador para permitir reabrir a etapa
    if (!podeReabrirAtividade()) {
      toast.error("Apenas administradores podem reabrir atividades concluídas");
      return;
    }
    
    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        false,
        funcionario.id, 
        funcionario.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      toast.success("Etapa reaberta para continuação");
    }
  };

  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  const handleConfirmarAtribuicao = (onEtapaStatusChange?: any) => {
    if (onEtapaStatusChange) {
      const funcId = funcionarioSelecionadoId || funcionario?.id;
      const funcNome = funcionarioSelecionadoNome || funcionario?.nome;
      
      if (dialogAction === 'start') {
        // Apenas inicia o timer com o funcionário selecionado
        handleTimerStart();
      } else if (dialogAction === 'finish') {
        // Marca a etapa como concluída com o funcionário selecionado
        onEtapaStatusChange(
          etapa, 
          true, 
          funcId, 
          funcNome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }
    }
    setAtribuirFuncionarioDialogOpen(false);
  };
  
  return {
    isAtivo,
    setIsAtivo,
    progresso,
    setProgresso,
    funcionariosOptions,
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    podeReabrirAtividade,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido,
    isEtapaConcluida,
    getEtapaStatus,
    handleReiniciarEtapa,
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    setDialogAction,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange,
    handleConfirmarAtribuicao
  };
}
