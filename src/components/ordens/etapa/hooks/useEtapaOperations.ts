
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useEtapaPermissoes } from "./useEtapaPermissoes";
import { useEtapaSubatividades } from "./useEtapaSubatividades";

export function useEtapaOperations(
  etapa: EtapaOS,
  servicoTipo?: TipoServico
) {
  const { funcionario, podeAtribuirFuncionario, podeReabrirAtividade } = useEtapaPermissoes(etapa, servicoTipo);
  const { verificarSubatividadesConcluidas } = useEtapaSubatividades();
  
  const handleTimerStart = (): boolean => {
    console.log("handleTimerStart chamado em useEtapaOperations");
    return true; // Indicate success
  };
  
  const handleIniciarTimer = (
    setDialogAction: (action: 'start' | 'finish') => void,
    setAtribuirFuncionarioDialogOpen: (open: boolean) => void
  ): boolean => {
    console.log("handleIniciarTimer chamado em useEtapaOperations");
    
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para iniciar uma etapa");
      return false;
    }

    if (podeAtribuirFuncionario) {
      setDialogAction('start');
      setAtribuirFuncionarioDialogOpen(true);
      return false; // Não permitir que o timer inicie até que o funcionário seja atribuído
    }
    
    // Retorna diretamente true para permitir que EtapaTimer.tsx controle o início do timer
    return true;
  };
  
  const handleMarcarConcluido = (
    setDialogAction: (action: 'start' | 'finish') => void,
    setAtribuirFuncionarioDialogOpen: (open: boolean) => void,
    servicos?: any[]
  ): boolean => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return false;
    }
    
    // Verificar se todas as subatividades estão concluídas
    if (servicos && !verificarSubatividadesConcluidas(servicos)) {
      return false;
    }

    // Não abrimos mais o diálogo para atribuir funcionário ao concluir
    return true;
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
  
  const handleConfirmarAtribuicao = (
    funcionarioSelecionadoId: string,
    funcionarioSelecionadoNome: string,
    dialogAction: 'start' | 'finish',
    setAtribuirFuncionarioDialogOpen: (open: boolean) => void,
    onEtapaStatusChange?: any
  ) => {
    if (onEtapaStatusChange) {
      const funcId = funcionarioSelecionadoId;
      const funcNome = funcionarioSelecionadoNome;
      
      if (dialogAction === 'start') {
        // Atribui o funcionário à etapa e inicia o timer
        onEtapaStatusChange(
          etapa,
          false,
          funcId,
          funcNome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
        console.log("Atribuição de funcionário para iniciar timer realizada com sucesso:", funcNome);
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
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido,
    handleReiniciarEtapa,
    handleConfirmarAtribuicao
  };
}
