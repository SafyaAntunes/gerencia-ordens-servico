
import { useState } from "react";
import { Servico, EtapaOS } from "@/types/ordens";
import { ServicoStatus } from "./types/servicoTrackerTypes";
import { markSubatividadeConcluida, markServicoCompleto } from "./utils/servicoFirebaseUtils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { prepareFuncionarioId } from "@/services/funcionarioService";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";

interface UseServicoTrackerParams {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoUpdate?: (servicoAtualizado: Servico) => void;
}

export function useServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onSubatividadeToggle,
  onServicoStatusChange,
  onSubatividadeSelecionadaToggle,
  onServicoUpdate
}: UseServicoTrackerParams) {
  const [isShowingDetails, setIsShowingDetails] = useState(false);
  const { funcionario } = useAuth();
  
  // Integrate useOrdemTimer hook
  const timer = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico: servico.tipo,
    isEtapaConcluida: servico.concluido
  });
  
  const temPermissao = funcionario?.id === funcionarioId || 
    funcionario?.cargo === 'admin' || 
    funcionario?.cargo === 'supervisor';
  
  const toggleDetails = () => {
    setIsShowingDetails(!isShowingDetails);
  };
  
  const handleSubatividadeToggle = async (subatividadeId: string, checked: boolean) => {
    console.log("handleSubatividadeToggle", subatividadeId, checked);
    
    if (onSubatividadeToggle) {
      onSubatividadeToggle(subatividadeId, checked);
    } else {
      try {
        // Update in Firebase
        await markSubatividadeConcluida(ordemId, etapa, servico.tipo, subatividadeId, checked);
        
        if (checked) {
          toast.success("Subatividade marcada como concluída");
        } else {
          toast.success("Subatividade desmarcada");
        }
      } catch (error) {
        console.error("Erro ao marcar subatividade:", error);
        toast.error("Não foi possível atualizar a subatividade");
      }
    }
  };
  
  const handleServicoConcluidoToggle = async (checked: boolean) => {
    if (onServicoStatusChange) {
      onServicoStatusChange(
        checked, 
        checked ? prepareFuncionarioId(funcionario?.id) : undefined,
        checked ? funcionario?.nome : undefined
      );
      
      // If service is being completed and timer is running, stop it
      if (checked && (timer.isRunning || timer.isPaused)) {
        timer.handleFinish();
      }
    } else {
      try {
        await markServicoCompleto(
          ordemId, 
          etapa, 
          servico.tipo, 
          checked, 
          funcionario?.id,
          funcionario?.nome
        );
        
        if (checked) {
          // Stop timer if completing the service
          if (timer.isRunning || timer.isPaused) {
            timer.handleFinish();
          }
          toast.success("Serviço marcado como concluído");
        } else {
          toast.success("Serviço desmarcado");
        }
      } catch (error) {
        console.error("Erro ao marcar serviço:", error);
        toast.error("Não foi possível atualizar o serviço");
      }
    }
  };
  
  const handleSubatividadeSelecionadaToggle = (subatividadeId: string, checked: boolean) => {
    console.log("handleSubatividadeSelecionadaToggle", subatividadeId, checked);
    if (onSubatividadeSelecionadaToggle) {
      onSubatividadeSelecionadaToggle(subatividadeId, checked);
    }
  };
  
  return {
    isShowingDetails,
    toggleDetails,
    handleSubatividadeToggle,
    handleServicoConcluidoToggle,
    handleSubatividadeSelecionadaToggle,
    temPermissao,
    timer // Return the timer to make it accessible in ServicoTracker
  };
}
