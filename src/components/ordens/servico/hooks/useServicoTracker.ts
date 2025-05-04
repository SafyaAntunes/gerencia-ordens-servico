import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import { useAuth } from "@/hooks/useAuth";
import { UseServicoTrackerProps, UseServicoTrackerResult } from "./types/servicoTrackerTypes";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";

export type ServicoStatus = "concluido" | "em_andamento" | "nao_iniciado";

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
  
  const timerRef = useRef<any>(null);
  
  const temPermissao = canEditOrder(ordemId);
  
  const {
    isRunning,
    isPaused,
    displayTime,
    handleStart,
    handlePause: pauseTimer,
    handleResume: resumeTimer,
    handleFinish: finishTimer,
    pausas
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
    }
  });
  
  const [pausas, setPausas] = useState<{inicio: number; fim?: number; motivo?: string}[]>([]);
  
  const handlePause = (motivo?: string) => {
    pauseTimer();
    toast.success("Timer pausado");
    
    if (timerRef.current) {
      const timerPausas = timerRef.current.pausas || [];
      setPausas([...timerPausas]);
    }
  };
  
  const handleResume = () => {
    resumeTimer();
    toast.success("Timer retomado");
    
    if (timerRef.current) {
      const timerPausas = timerRef.current.pausas || [];
      setPausas([...timerPausas]);
    }
  };
  
  useEffect(() => {
    if (timerRef.current) {
      const timerPausas = timerRef.current.pausas || [];
      setPausas(timerPausas);
    }
  }, [isRunning, isPaused]);
  
  const servicoStatus: ServicoStatus = servico.concluido
    ? "concluido"
    : isRunning || isPaused
      ? "em_andamento"
      : "nao_iniciado";
  
  const completedSubatividades = servico.subatividades?.filter(sub => sub.concluida).length || 0;
  const totalSubatividades = servico.subatividades?.filter(sub => sub.selecionada).length || 0;
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
    if (onServicoStatusChange) {
      onServicoStatusChange(true, funcionario?.id, funcionario?.nome);
    }
  };
  
  const handleReiniciarServico = () => {
    if (onServicoStatusChange) {
      onServicoStatusChange(false);
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
    handleMarcarConcluido,
    handleReiniciarServico
  };
}
