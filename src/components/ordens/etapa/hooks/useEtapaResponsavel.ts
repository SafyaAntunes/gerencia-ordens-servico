
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId: string;
  funcionarioSelecionadoNome: string;
  isEtapaConcluida: (etapaInfo?: any) => boolean;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  etapaInfo?: any;
  ordemId: string;
}

export function useEtapaResponsavel({
  etapa,
  servicoTipo,
  funcionarioSelecionadoId,
  funcionarioSelecionadoNome,
  isEtapaConcluida,
  onEtapaStatusChange,
  etapaInfo,
  ordemId
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
  
  // Função para salvar o responsável diretamente no Firebase
  const handleSaveResponsavel = async () => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável para salvar");
      return;
    }

    if (!ordemId) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    try {
      // Determinar a chave da etapa com base no tipo de serviço
      const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) 
        ? `${etapa}_${servicoTipo}` 
        : etapa;
      
      console.log(`Salvando responsável para etapa ${etapaKey}: ${funcionarioSelecionadoNome} (${funcionarioSelecionadoId})`);
      
      // Buscar etapa atual para preservar dados
      const etapaAtual = etapaInfo || {};
      const etapaConcluida = isEtapaConcluida(etapaInfo);
      
      // Referência ao documento da ordem
      const ordemRef = doc(db, "ordens_servico", ordemId);
      
      // Atualizar apenas o campo de responsável na etapa específica
      await updateDoc(ordemRef, {
        [`etapasAndamento.${etapaKey}.funcionarioId`]: funcionarioSelecionadoId,
        [`etapasAndamento.${etapaKey}.funcionarioNome`]: funcionarioSelecionadoNome,
        // Preservar outros campos importantes
        [`etapasAndamento.${etapaKey}.concluido`]: etapaConcluida,
        // Se for primeira atribuição, definir data de início
        [`etapasAndamento.${etapaKey}.iniciado`]: etapaAtual.iniciado || new Date(),
      });
      
      // Atualizar valores salvos localmente
      setLastSavedFuncionarioId(funcionarioSelecionadoId);
      setLastSavedFuncionarioNome(funcionarioSelecionadoNome);
      
      // Chamar callback se existir (para atualizar estado pai)
      if (onEtapaStatusChange) {
        onEtapaStatusChange(
          etapa,
          etapaConcluida,
          funcionarioSelecionadoId,
          funcionarioSelecionadoNome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }
      
      toast.success(`Responsável ${funcionarioSelecionadoNome} salvo com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Não foi possível salvar o responsável");
    }
  };
  
  const handleCustomTimerStart = (): boolean => {
    if (!funcionarioSelecionadoId && !lastSavedFuncionarioId) {
      toast.error("É necessário selecionar e salvar um responsável antes de iniciar a etapa");
      return false;
    }
    
    return true;
  };
  
  const handleMarcarConcluidoClick = () => {
    if (!funcionarioSelecionadoId && !lastSavedFuncionarioId) {
      toast.error("É necessário selecionar e salvar um responsável antes de concluir a etapa");
      return;
    }
    
    // Usar o último responsável salvo ou o atualmente selecionado
    const responsavelId = lastSavedFuncionarioId || funcionarioSelecionadoId;
    const responsavelNome = lastSavedFuncionarioNome || funcionarioSelecionadoNome;
    
    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        true, 
        responsavelId, 
        responsavelNome,
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
