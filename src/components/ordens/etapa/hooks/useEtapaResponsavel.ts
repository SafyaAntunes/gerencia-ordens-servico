import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";
import { clearDocumentCache } from "@/services/cacheService";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId?: string;
  funcionarioSelecionadoNome?: string;
  isEtapaConcluida?: boolean;
  onEtapaStatusChange?: (
    etapa: EtapaOS,
    concluida: boolean,
    funcionarioId?: string,
    funcionarioNome?: string,
    servicoTipo?: TipoServico
  ) => void;
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    funcionarioId?: string;
    funcionarioNome?: string;
    servicoTipo?: TipoServico;
    status?: string;
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
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      setLastSavedFuncionarioId(etapaInfo.funcionarioId);
      setLastSavedFuncionarioNome(etapaInfo.funcionarioNome);
    } else {
      setLastSavedFuncionarioId(undefined);
      setLastSavedFuncionarioNome(undefined);
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome]);

  const lastUpdateTime = useRef<number>(0);
  const updateDebounceMs = 2000;

  const recentNotifications = useRef<Record<string, number>>({});
  const notificationDebounceMs = 3000;

  const canShowNotification = useCallback((message: string): boolean => {
    const now = Date.now();
    const lastShown = recentNotifications.current[message] || 0;
    if (now - lastShown > notificationDebounceMs) {
      recentNotifications.current[message] = now;
      return true;
    }
    return false;
  }, []);

  // Define cache key for this order
  const cacheKey = `ordens/${ordemId}`;

  const handleSaveResponsavel = useCallback(async (ids?: string[], nomes?: string[]) => {
    if (isSaving) return;
    
    setIsSaving(true);
    const now = Date.now();
    
    try {
      // Handle both single and multiple funcionarios assignment
      let funcionariosIds: string[] = [];
      let funcionariosNomes: string[] = [];
      
      // If we receive arrays of ids and names, use those (multi-funcionario mode)
      if (ids && nomes) {
        funcionariosIds = ids;
        funcionariosNomes = nomes;
      } 
      // Otherwise use the single funcionario selected
      else if (funcionarioSelecionadoId) {
        funcionariosIds = [funcionarioSelecionadoId];
        funcionariosNomes = [funcionarioSelecionadoNome || ''];
      }
      
      console.log("Saving funcionarios:", funcionariosIds, funcionariosNomes);
      
      // If no funcionarios selected and this is a deletion operation
      if (funcionariosIds.length === 0 && ids !== undefined) {
        // Mark removal in Firebase - update with empty fields
        const etapaDocRef = doc(db, `ordens/${ordemId}`);
        await updateDoc(etapaDocRef, {
          [`etapasAndamento.${etapa}.funcionarioId`]: "",
          [`etapasAndamento.${etapa}.funcionarioNome`]: ""
        });
        
        // Clear local cache for this order
        clearDocumentCache(`ordens/${ordemId}`);
        
        // Update local state
        setLastSavedFuncionarioId(undefined);
        setLastSavedFuncionarioNome(undefined);
        
        // Invalidate queries to force a refetch
        queryClient.invalidateQueries({queryKey: ['ordens', ordemId]});
        
        if (canShowNotification("Responsável removido")) {
          toast.success("Responsável removido com sucesso!");
        }
        return;
      }
      
      // If no funcionarios to save, don't do anything
      if (funcionariosIds.length === 0) {
        console.log("Nenhum funcionário para salvar");
        return;
      }

      // For multiple funcionarios or single funcionario
      const promisesArray = funcionariosIds.map((id, index) => {
        return marcarFuncionarioEmServico(
          id,
          ordemId,
          etapa,
          servicoTipo
        );
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(promisesArray);
      
      // Check if any failed
      if (results.some(success => !success)) {
        toast.error("Erro ao atribuir um ou mais funcionários");
        return;
      }

      // Update local state
      setLastSavedFuncionarioId(funcionariosIds[0]); // Keep first one for backwards compatibility
      setLastSavedFuncionarioNome(funcionariosNomes[0]);
      lastUpdateTime.current = now;

      // Clear cache to ensure fresh data on next fetch
      clearDocumentCache(cacheKey);
      
      // Invalidate queries to force a refetch
      queryClient.invalidateQueries({queryKey: ['ordens', ordemId]});

      if (canShowNotification("Responsável atualizado")) {
        toast.success(`${funcionariosIds.length > 1 ? 'Responsáveis atualizados' : 'Responsável atualizado'} com sucesso!`);
      }
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Erro ao salvar responsável");
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    ordemId,
    etapa,
    servicoTipo,
    cacheKey,
    canShowNotification,
    queryClient
  ]);

  // Auto-save effect when funcionario changes
  useEffect(() => {
    if (
      funcionarioSelecionadoId &&
      funcionarioSelecionadoId !== lastSavedFuncionarioId &&
      !isSaving
    ) {
      const timeout = setTimeout(() => {
        handleSaveResponsavel();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [funcionarioSelecionadoId, lastSavedFuncionarioId, isSaving, handleSaveResponsavel]);

  const handleMarcarConcluidoClick = useCallback(() => {
    if (isEtapaConcluida) {
      toast.error("Esta etapa já está concluída");
      return;
    }

    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável antes de concluir a etapa");
      return;
    }

    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa,
        true,
        funcionarioSelecionadoId,
        funcionarioSelecionadoNome,
        servicoTipo
      );
    }
  }, [
    isEtapaConcluida,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    onEtapaStatusChange,
    etapa,
    servicoTipo
  ]);

  const handleCustomTimerStart = useCallback(() => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável primeiro");
      return false;
    }
    return true;
  }, [funcionarioSelecionadoId]);

  return {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome,
    isSaving
  };
}
