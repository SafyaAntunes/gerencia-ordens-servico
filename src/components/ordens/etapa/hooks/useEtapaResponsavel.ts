import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useSWR, { mutate } from "swr";

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

  const handleSaveResponsavel = useCallback(async () => {
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

    const isSameFuncionario = lastSavedFuncionarioId === funcionarioSelecionadoId;
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

      const cacheKey = `ordens_servico/${ordemId}`;

      if (onEtapaStatusChange) {
        await onEtapaStatusChange(
          etapa,
          !!isEtapaConcluida,
          funcionarioSelecionadoId,
          funcionarioSelecionadoNome,
          servicoTipo
        );
      } else {
        const etapaKey =
          (["inspecao_inicial", "inspecao_final", "lavagem"].includes(etapa) && servicoTipo)
            ? `${etapa}_${servicoTipo}`
            : etapa;

        const ordemRef = doc(db, "ordens_servico", ordemId);
        await updateDoc(ordemRef, {
          [`etapasAndamento.${etapaKey}.funcionarioId`]: funcionarioSelecionadoId,
          [`etapasAndamento.${etapaKey}.funcionarioNome`]: funcionarioSelecionadoNome || "",
          [`etapasAndamento.${etapaKey}.iniciado`]: etapaInfo?.iniciado || new Date(),
          [`etapasAndamento.${etapaKey}.concluido`]: etapaInfo?.concluido || false,
          [`etapasAndamento.${etapaKey}.finalizado`]: etapaInfo?.finalizado || null,
          [`etapasAndamento.${etapaKey}.servicoTipo`]: servicoTipo || null,
          [`etapasAndamento.${etapaKey}.status`]: etapaInfo?.status || "em_andamento"
        });
      }

      setLastSavedFuncionarioId(funcionarioSelecionadoId);
      setLastSavedFuncionarioNome(funcionarioSelecionadoNome);
      lastUpdateTime.current = now;

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
