
import { useState } from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { marcarVariosFuncionariosEmServico } from "@/services/funcionarioEmServicoService";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId?: string;
  funcionarioSelecionadoNome?: string;
  isEtapaConcluida: boolean;
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
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedFuncionarioId, setLastSavedFuncionarioId] = useState<string | undefined>(
    etapaInfo?.funcionarioId
  );
  const [lastSavedFuncionarioNome, setLastSavedFuncionarioNome] = useState<string | undefined>(
    etapaInfo?.funcionarioNome
  );

  // Função para salvar o responsável
  const handleSaveResponsavel = async (funcionariosIds: string[] = [], funcionariosNomes: string[] = []) => {
    if (!ordemId) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    setIsSaving(true);
    try {
      // Determinar a chave da etapa com base no tipo de serviço
      const etapaKey = (etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo
        ? `${etapa}_${servicoTipo}`
        : etapa;
      
      console.log(`Atualizando responsáveis da etapa ${etapaKey}, funcionários IDs:`, funcionariosIds);
      
      // Obter documento atual para garantir dados atualizados
      const ordemRef = doc(db, "ordens_servico", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem de serviço não encontrada");
        return;
      }
      
      const dadosAtuais = ordemDoc.data();
      const etapasAndamento = dadosAtuais.etapasAndamento || {};
      const etapaAtual = etapasAndamento[etapaKey] || {};
      
      // Se for um array vazio, remover todos os funcionários
      if (funcionariosIds.length === 0) {
        await updateDoc(ordemRef, {
          [`etapasAndamento.${etapaKey}.funcionarios`]: [],
          [`etapasAndamento.${etapaKey}.funcionarioId`]: null,
          [`etapasAndamento.${etapaKey}.funcionarioNome`]: null
        });
        
        toast.success(`Todos funcionários removidos da etapa ${etapa}`);
        setLastSavedFuncionarioId(undefined);
        setLastSavedFuncionarioNome(undefined);
        return;
      }
      
      // Registrar todos os funcionários selecionados como "em serviço" para esta etapa
      await marcarVariosFuncionariosEmServico(funcionariosIds, ordemId, etapa, servicoTipo);
      
      // Manter compatibilidade com versão anterior do sistema (único funcionário)
      // Primeiro funcionário da lista é o "principal"
      const principalId = funcionariosIds[0];
      const principalNome = funcionariosNomes[0];
      
      // Registrar funcionário "principal" (para compatibilidade com versão anterior)
      await updateDoc(ordemRef, {
        [`etapasAndamento.${etapaKey}.funcionarioId`]: principalId,
        [`etapasAndamento.${etapaKey}.funcionarioNome`]: principalNome
      });
      
      toast.success(`Responsáveis atualizados com sucesso!`);
      
      // Atualizar estado local
      setLastSavedFuncionarioId(principalId);
      setLastSavedFuncionarioNome(principalNome);
      
      // Chamar callback se existir
      if (onEtapaStatusChange) {
        onEtapaStatusChange(
          etapa,
          isEtapaConcluida, // Manter status de conclusão
          principalId,
          principalNome,
          servicoTipo
        );
      }
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Erro ao salvar responsável");
    } finally {
      setIsSaving(false);
    }
  };

  // Changed to return boolean instead of Promise<boolean> to match expected type
  const handleCustomTimerStart = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("Selecione um funcionário antes de iniciar o timer");
      return false;
    }
    
    // Call the async function without awaiting it
    handleSaveResponsavel(
      [funcionarioSelecionadoId], 
      [funcionarioSelecionadoNome || ""]
    );
    
    return true;
  };

  const handleMarcarConcluidoClick = async () => {
    if (!onEtapaStatusChange) return;
    
    // Usar o último funcionário salvo ou o selecionado
    const useId = lastSavedFuncionarioId || funcionarioSelecionadoId;
    const useNome = lastSavedFuncionarioNome || funcionarioSelecionadoNome;
    
    if (!useId) {
      toast.error("É necessário selecionar um responsável antes de concluir a etapa");
      return;
    }
    
    onEtapaStatusChange(
      etapa,
      true, // Marcando como concluída
      useId,
      useNome,
      servicoTipo
    );
  };

  return {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome,
    isSaving
  };
}
