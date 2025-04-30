
import { useState } from "react";
import { EtapaOS, TipoServico, Servico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSubatividadesVerifier } from "./hooks/useSubatividadesVerifier";

export function useEtapaCard(etapa: EtapaOS, servicoTipo?: TipoServico) {
  const { funcionario } = useAuth();
  const { verificarSubatividadesConcluidas } = useSubatividadesVerifier();
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  
  // Verificar se o usuário tem permissão para atribuir funcionários
  const podeAtribuirFuncionario = () => {
    return funcionario?.nivelPermissao === 'admin' || 
           funcionario?.nivelPermissao === 'gerente';
  };
  
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
  
  const handleTimerStart = (): boolean => {
    console.log("handleTimerStart chamado em useEtapaCard");
    return true; // Return true to indicate success
  };
  
  const handleIniciarTimer = (): boolean => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para iniciar uma etapa");
      return false;
    }

    if (podeAtribuirFuncionario()) {
      setDialogAction('start');
      setAtribuirFuncionarioDialogOpen(true);
      return false;
    } else {
      // Próprio usuário inicia o timer
      return true; // EtapaTimer chamará handleTimerStart diretamente
    }
  };
  
  const handleMarcarConcluido = (servicos?: Servico[]): boolean => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return false;
    }
    
    // Verificar se todas as subatividades estão concluídas
    if (!verificarSubatividadesConcluidas(servicos)) {
      return false;
    }
    
    if (podeAtribuirFuncionario()) {
      setDialogAction('finish');
      setAtribuirFuncionarioDialogOpen(true);
      return false;
    } 
    
    return true;
  };
  
  const handleReiniciarEtapa = (onEtapaStatusChange?: any) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para reiniciar uma etapa");
      return;
    }
    
    if (!podeAtribuirFuncionario() && !podeTrabalharNaEtapa()) {
      toast.error("Você não tem permissão para reiniciar esta etapa");
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
    const funcionarioSelecionado = { id: value, nome: "" };
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
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido,
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
