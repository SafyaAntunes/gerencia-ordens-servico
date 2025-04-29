
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Funcionario } from "@/types/funcionarios";
import { SubAtividade } from "@/types/ordens";
import { 
  UseServicoTrackerProps, 
  UseServicoTrackerResult,
  ServicoStatus 
} from "./types/servicoTrackerTypes";
import { 
  calculateServicoStatus, 
  computeSubatividadeMetrics 
} from "./utils/servicoTrackerUtils";
import { useServicoTimer } from "./utils/servicoTimerUtils";
import { loadFuncionario } from "./utils/servicoFirebaseUtils";

export type { ServicoStatus } from "./types/servicoTrackerTypes";

export function useServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onServicoStatusChange,
  onSubatividadeToggle,
}: UseServicoTrackerProps): UseServicoTrackerResult {
  const [isOpen, setIsOpen] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const { toast } = useToast();

  // Import timer functionality
  const {
    isRunning,
    isPaused,
    displayTime,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish
  } = useServicoTimer();

  // Compute derived state using our utility functions
  const {
    filtradas: subatividadesFiltradas,
    completedCount: completedSubatividades,
    totalCount: totalSubatividades,
    tempoTotalEstimado,
    progressPercentage
  } = useMemo(() => 
    computeSubatividadeMetrics(servico.subatividades), 
    [servico.subatividades]
  );

  const servicoStatus = useMemo((): ServicoStatus => 
    calculateServicoStatus(
      servico.concluido, 
      isPaused, 
      isRunning, 
      servico.subatividades
    ), 
    [servico.concluido, isPaused, isRunning, servico.subatividades]
  );

  const temPermissao = true; // Simplified for this example, actual logic would be based on user permissions

  const handleSubatividadeToggle = useCallback((subatividade: SubAtividade) => {
    if (!ordemId || !servico || !subatividade || !subatividade.id) return;
    
    try {
      console.log("Toggling subatividade:", subatividade.id, "to", !subatividade.concluida);
      
      // Call the parent component's toggle handler with the new state
      onSubatividadeToggle(subatividade.id, !subatividade.concluida);
    } catch (error) {
      console.error("Error toggling subatividade:", error);
      toast({ 
        title: "Erro", 
        description: "Não foi possível atualizar a subatividade.",
        variant: "destructive" 
      });
    }
  }, [ordemId, servico, onSubatividadeToggle, toast]);
  
  const handleLoadFuncionarios = useCallback(async () => {
    if (!funcionarioId) return;
    
    try {
      const funcionarioData = await loadFuncionario(funcionarioId);
      if (funcionarioData) {
        setFuncionariosOptions([funcionarioData]);
      }
    } catch (error) {
      console.error("Failed to load funcionario:", error);
    }
  }, [funcionarioId]);

  const handleMarcarConcluido = useCallback(() => {
    onServicoStatusChange(true, funcionarioId, funcionarioNome);
    handleFinish();
    toast({
      title: "Serviço Concluído",
      description: "Este serviço foi marcado como concluído.",
    });
  }, [funcionarioId, funcionarioNome, onServicoStatusChange, handleFinish, toast]);

  const handleReiniciarServico = useCallback(() => {
    onServicoStatusChange(false, null, null);
    handleFinish();
    toast({
      title: "Serviço Reiniciado",
      description: "Este serviço foi reiniciado e está pronto para ser trabalhado novamente.",
    });
  }, [onServicoStatusChange, handleFinish, toast]);

  // Update timer state when service status changes
  useEffect(() => {
    if (servico.concluido) {
      handleFinish();
    }
  }, [servico.concluido, handleFinish]);

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
