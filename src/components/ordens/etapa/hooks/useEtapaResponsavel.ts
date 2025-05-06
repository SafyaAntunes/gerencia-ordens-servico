
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useState, useEffect } from "react";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId: string;
  funcionarioSelecionadoNome: string;
  isEtapaConcluida: (etapaInfo?: any) => boolean;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  etapaInfo?: any;
}

export function useEtapaResponsavel({
  etapa,
  servicoTipo,
  funcionarioSelecionadoId,
  funcionarioSelecionadoNome,
  isEtapaConcluida,
  onEtapaStatusChange,
  etapaInfo
}: UseEtapaResponsavelProps) {
  // Estado para rastrear a última seleção de funcionário, garantindo persistência
  const [lastSavedFuncionarioId, setLastSavedFuncionarioId] = useState<string>("");
  const [lastSavedFuncionarioNome, setLastSavedFuncionarioNome] = useState<string>("");
  
  // Inicializa os valores salvos com os valores atuais de etapaInfo
  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      setLastSavedFuncionarioId(etapaInfo.funcionarioId);
      setLastSavedFuncionarioNome(etapaInfo.funcionarioNome || "");
      console.log(`useEtapaResponsavel: Inicializando com funcionário da etapaInfo - ID: ${etapaInfo.funcionarioId}, Nome: ${etapaInfo.funcionarioNome}`);
    }
  }, [etapaInfo]);
  
  // Função para salvar o responsável - works during execution
  const handleSaveResponsavel = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável para salvar");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Manter o status atual (concluído ou não) mas atualizar o funcionário
      const etapaConcluida = isEtapaConcluida(etapaInfo);
      
      console.log("Salvando responsável:", {
        etapa,
        concluida: etapaConcluida,
        funcionarioId: funcionarioSelecionadoId,
        funcionarioNome: funcionarioSelecionadoNome,
        servicoTipo: (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      });
      
      // Atualizar os valores salvos
      setLastSavedFuncionarioId(funcionarioSelecionadoId);
      setLastSavedFuncionarioNome(funcionarioSelecionadoNome);
      
      // IMPORTANTE: Preservar o estado iniciado da etapaInfo, não resetar
      onEtapaStatusChange(
        etapa,
        etapaConcluida,
        funcionarioSelecionadoId,
        funcionarioSelecionadoNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      toast.success(`Responsável ${funcionarioSelecionadoNome} salvo com sucesso!`);
    } else {
      console.error("onEtapaStatusChange não está definido");
      toast.error("Não foi possível salvar o responsável");
    }
  };
  
  const handleCustomTimerStart = (): boolean => {
    console.log("handleCustomTimerStart chamado em useEtapaResponsavel");
    
    // Use o funcionário selecionado ou o último salvo
    const funcionarioId = funcionarioSelecionadoId || lastSavedFuncionarioId;
    const funcionarioNome = funcionarioSelecionadoNome || lastSavedFuncionarioNome;
    
    if (!funcionarioId) {
      toast.error("É necessário selecionar um responsável antes de iniciar a etapa");
      return false;
    }
    
    // Se estamos iniciando a etapa, vamos atualizar o status com o funcionário responsável
    if (onEtapaStatusChange && !etapaInfo?.iniciado) {
      onEtapaStatusChange(
        etapa,
        false,
        funcionarioId,
        funcionarioNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
    
    return true; // Permite que o timer inicie automaticamente
  };
  
  const handleMarcarConcluidoClick = () => {
    // Use o funcionário selecionado ou o último salvo
    const funcionarioId = funcionarioSelecionadoId || lastSavedFuncionarioId;
    const funcionarioNome = funcionarioSelecionadoNome || lastSavedFuncionarioNome;
    
    if (!funcionarioId) {
      toast.error("É necessário selecionar um responsável antes de concluir a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Usa o ID e nome do funcionário selecionado
      console.log("Concluindo etapa com funcionário:", funcionarioNome);
      
      onEtapaStatusChange(
        etapa, 
        true, 
        funcionarioId, 
        funcionarioNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };
  
  return {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome
  };
}
