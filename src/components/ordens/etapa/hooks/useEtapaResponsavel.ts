import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useSWR, { mutate } from "swr";
import { marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";

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

  const cacheKey = `ordens_servico/${ordemId}`;

  const handleSaveResponsavel = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    const now = Date.now();
    
    try {
      // Se não houver funcionário selecionado, não fazer nada
      if (!funcionarioSelecionadoId) {
        console.log("Nenhum funcionário selecionado para salvar");
        return;
      }

      // Primeiro, marcar o funcionário como ocupado usando o serviço
      const success = await marcarFuncionarioEmServico(
        funcionarioSelecionadoId,
        ordemId,
        etapa,
        servicoTipo
      );

      if (!success) {
        toast.error("Erro ao atribuir funcionário");
        return;
      }

      // Depois, atualizar o estado local e o cache
      setLastSavedFuncionarioId(funcionarioSelecionadoId);
      setLastSavedFuncionarioNome(funcionarioSelecionadoNome);
      lastUpdateTime.current = now;

      // Atualizar o cache
      await mutate(cacheKey);

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
    isSaving,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    ordemId,
    etapa,
    servicoTipo,
    cacheKey
  ]);

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
