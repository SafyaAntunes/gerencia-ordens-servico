
import { useEffect } from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { 
  UseEtapaCardProps, 
  UseEtapaCardResult,
  useEtapaPermissoes,
  useFuncionarioSelect,
  useEtapaStatus,
  useEtapaDialogs,
  useEtapaOperations,
  useEtapaSubatividades
} from "./hooks";

export function useEtapaCard(etapa: EtapaOS, servicoTipo?: TipoServico): UseEtapaCardResult {
  // Load hooks with specific functionality
  const { 
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    podeReabrirAtividade
  } = useEtapaPermissoes(etapa, servicoTipo);
  
  const {
    funcionariosOptions,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange
  } = useFuncionarioSelect();
  
  const {
    isAtivo,
    setIsAtivo,
    progresso,
    setProgresso,
    isEtapaConcluida,
    getEtapaStatus
  } = useEtapaStatus(etapa, servicoTipo);
  
  const {
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    setDialogAction,
    funcionario
  } = useEtapaDialogs();
  
  const {
    handleIniciarTimer: iniciarTimer,
    handleTimerStart,
    handleMarcarConcluido: marcarConcluido,
    handleReiniciarEtapa: reiniciarEtapa,
    handleConfirmarAtribuicao: confirmarAtribuicao
  } = useEtapaOperations(etapa, servicoTipo);

  const { todasSubatividadesConcluidas } = useEtapaSubatividades();
  
  // Implement wrapper functions that use the hooks above
  const handleIniciarTimer = () => {
    return iniciarTimer(setDialogAction, setAtribuirFuncionarioDialogOpen);
  };
  
  const handleMarcarConcluido = () => {
    return marcarConcluido(setDialogAction, setAtribuirFuncionarioDialogOpen);
  };
  
  const handleReiniciarEtapa = (onEtapaStatusChange: any) => {
    reiniciarEtapa(onEtapaStatusChange);
  };
  
  const handleConfirmarAtribuicao = (onEtapaStatusChange?: any) => {
    confirmarAtribuicao(
      funcionarioSelecionadoId,
      funcionarioSelecionadoNome,
      dialogAction,
      setAtribuirFuncionarioDialogOpen,
      onEtapaStatusChange
    );
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
