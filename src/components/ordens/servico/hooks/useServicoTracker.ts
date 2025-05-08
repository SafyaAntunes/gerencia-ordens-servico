
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import { useAuth } from "@/hooks/useAuth";
import { UseServicoTrackerProps, UseServicoTrackerResult, ServicoStatus, PausaRegistro } from "./types/servicoTrackerTypes";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { getServicoStatus } from "./utils/servicoTrackerUtils";

export function useServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onServicoStatusChange,
  onSubatividadeToggle
}: UseServicoTrackerProps): UseServicoTrackerResult {
  const { funcionario, canEditOrder } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  
  const temPermissao = canEditOrder(ordemId);
  
  const {
    isRunning,
    isPaused,
    displayTime,
    handleStart,
    handlePause: pauseTimer,
    handleResume: resumeTimer,
    handleFinish: finishTimer,
    pausas: timerPausas
  } = useOrdemTimer({
    ordemId,
    etapa: etapa as EtapaOS,
    tipoServico: servico.tipo,
    onPause: () => {
      toast.success("Timer pausado");
    },
    onResume: () => {
      toast.success("Timer retomado");
    },
    onFinish: () => {
      toast.success("Timer finalizado");
    },
    isEtapaConcluida: servico.concluido
  });

  // Convert timer pausas to PausaRegistro format
  const pausas: PausaRegistro[] = timerPausas.map(p => ({
    iniciado: p.inicio,
    finalizado: p.fim,
    motivo: p.motivo
  }));
  
  const handlePause = (motivo?: string) => {
    pauseTimer(motivo);
    toast.success("Timer pausado");
  };
  
  const handleResume = () => {
    resumeTimer();
    toast.success("Timer retomado");
  };
  
  // Determine service status based on running, paused and completed states
  const servicoStatus: ServicoStatus = getServicoStatus(isRunning, isPaused, servico.concluido);
  
  const completedSubatividades = servico.subatividades?.filter(sub => sub.concluida).length || 0;
  const totalSubatividades = servico.subatividades?.filter(sub => sub.selecionada).length || 0;
  
  // Ensure progressPercentage is a number
  const progressPercentage = totalSubatividades > 0 ? Math.round((completedSubatividades / totalSubatividades) * 100) : 0;
  
  const tempoTotalEstimado = servico.subatividades?.reduce((total, sub) => {
    return sub.selecionada && sub.tempoEstimado ? total + sub.tempoEstimado : total;
  }, 0) || 0;
  
  const subatividadesFiltradas = servico.subatividades?.filter(sub => sub.selecionada) || [];
  
  const handleLoadFuncionarios = useCallback(async () => {
    try {
      const funcionariosData = await getFuncionarios();
      if (funcionariosData) {
        setFuncionariosOptions(funcionariosData);
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast.error("Erro ao carregar lista de funcionários");
    }
  }, []);
  
  const handleSubatividadeToggle = (subatividadeId: string, checked: boolean) => {
    if (onSubatividadeToggle) {
      onSubatividadeToggle(subatividadeId, checked);
    }
  };
  
  const handleStartClick = () => {
    handleStart();
  };
  
  const handleFinish = () => {
    finishTimer();
  };
  
  const handleMarcarConcluido = () => {
    // Se o timer ainda estiver rodando, finalizar primeiro
    if (isRunning || isPaused) {
      finishTimer();
    }
    
    if (onServicoStatusChange) {
      // Usar o ID do funcionário atual
      onServicoStatusChange(true, funcionario?.id, funcionario?.nome);
    }
  };
  
  return {
    isOpen,
    setIsOpen,
    funcionariosOptions,
    temPermissao,
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    pausas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido
  };
}
