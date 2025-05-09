
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { clearDocumentCache } from "@/services/funcionarioEmServicoService";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId?: string;
  funcionarioSelecionadoNome?: string;
  isEtapaConcluida?: boolean;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    funcionarioId?: string;
    funcionarioNome?: string;
    servicoTipo?: TipoServico;
  };
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
  const { funcionario } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedFuncionarioId, setLastSavedFuncionarioId] = useState<string | undefined>(etapaInfo?.funcionarioId);
  const [lastSavedFuncionarioNome, setLastSavedFuncionarioNome] = useState<string | undefined>(etapaInfo?.funcionarioNome);
  
  // Debounce para evitar salvamentos muito próximos
  const lastUpdateTime = useRef<number>(0);
  const updateDebounceMs = 2000; // 2 segundos entre atualizações
  
  // Notificações exibidas recentemente
  const recentNotifications = useRef<Record<string, number>>({});
  const notificationDebounceMs = 3000; // 3 segundos entre notificações iguais
  
  // Função para verificar se uma notificação pode ser mostrada
  const canShowNotification = useCallback((message: string): boolean => {
    const now = Date.now();
    const lastShown = recentNotifications.current[message] || 0;
    
    if (now - lastShown > notificationDebounceMs) {
      recentNotifications.current[message] = now;
      return true;
    }
    
    return false;
  }, [notificationDebounceMs]);
  
  // Função para salvar o responsável
  const handleSaveResponsavel = useCallback(async () => {
    // Se não tiver funcionário selecionado ou já estiver salvando, não fazer nada
    if (!funcionarioSelecionadoId || isSaving) {
      console.log("Não foi possível salvar responsável:", {
        funcionarioSelecionadoId,
        isSaving
      });
      if (!funcionarioSelecionadoId) {
        toast.error("Selecione um funcionário antes de salvar");
      }
      return;
    }
    
    // Verificar se estamos atualizando para o mesmo funcionário
    const isSameFuncionario = lastSavedFuncionarioId === funcionarioSelecionadoId;
    
    // Verificar se passou tempo suficiente desde a última atualização
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    
    if (isSameFuncionario && timeSinceLastUpdate < updateDebounceMs) {
      console.log("Ignorando atualização recente para o mesmo funcionário");
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("Salvando responsável:", {
        funcionarioId: funcionarioSelecionadoId,
        funcionarioNome: funcionarioSelecionadoNome,
        etapa,
        servicoTipo,
        ordemId
      });
      
      // Limpar cache para garantir dados atualizados
      const cacheKey = `ordens_servico/${ordemId}`;
      clearDocumentCache(cacheKey);
      
      // Usar onEtapaStatusChange se disponível
      if (onEtapaStatusChange) {
        await onEtapaStatusChange(
          etapa, 
          !!isEtapaConcluida, // Manter o status atual
          funcionarioSelecionadoId,
          funcionarioSelecionadoNome,
          servicoTipo
        );
      } else {
        // Fallback: atualizar diretamente no Firestore se não tiver handler
        const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo) 
          ? `${etapa}_${servicoTipo}` 
          : etapa;
        
        const ordemRef = doc(db, "ordens_servico", ordemId);
        await updateDoc(ordemRef, {
          [`etapasAndamento.${etapaKey}.funcionarioId`]: funcionarioSelecionadoId,
          [`etapasAndamento.${etapaKey}.funcionarioNome`]: funcionarioSelecionadoNome || "",
        });
      }
      
      // Atualizar o estado local
      setLastSavedFuncionarioId(funcionarioSelecionadoId);
      setLastSavedFuncionarioNome(funcionarioSelecionadoNome);
      lastUpdateTime.current = now;
      
      // Mostrar mensagem de sucesso (debounced)
      if (canShowNotification("Responsável atualizado")) {
        toast.success("Responsável atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Erro ao salvar responsável");
    } finally {
      setIsSaving(false);
    }
  }, [
    funcionarioSelecionadoId, 
    funcionarioSelecionadoNome, 
    isSaving, 
    etapa, 
    servicoTipo, 
    ordemId, 
    lastSavedFuncionarioId, 
    isEtapaConcluida, 
    onEtapaStatusChange,
    canShowNotification
  ]);
  
  // Para iniciar o timer da etapa com o funcionário selecionado
  const handleCustomTimerStart = useCallback(() => {
    if (!funcionarioSelecionadoId && !funcionario?.id) {
      toast.error("É necessário selecionar um responsável primeiro");
      return false;
    }
    return true;
  }, [funcionarioSelecionadoId, funcionario?.id]);
  
  // Para marcar a etapa como concluída
  const handleMarcarConcluidoClick = useCallback(() => {
    // Verificar se é possível marcar como concluída
    if (isEtapaConcluida) {
      toast.error("Esta etapa já está concluída");
      return;
    }
    
    // Verificar se tem funcionário para atribuir
    if (!funcionarioSelecionadoId && !funcionario?.id) {
      toast.error("É necessário atribuir um responsável antes de concluir a etapa");
      return;
    }
    
    // Usar o funcionário selecionado ou o atual
    const useId = funcionarioSelecionadoId || funcionario?.id || "";
    const useNome = funcionarioSelecionadoNome || funcionario?.nome || "";
    
    // Marcar como concluído
    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        true, 
        useId, 
        useNome,
        servicoTipo
      );
    }
  }, [
    isEtapaConcluida, 
    funcionarioSelecionadoId, 
    funcionarioSelecionadoNome, 
    funcionario, 
    onEtapaStatusChange, 
    etapa, 
    servicoTipo
  ]);
  
  return {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome,
    isSaving
  };
}
