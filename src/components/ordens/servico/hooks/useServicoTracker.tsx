
import { useState, useEffect } from 'react';
import { ServicoStatus } from './types/servicoTrackerTypes';
import { Servico, EtapaOS, TipoServico } from '@/types/ordens';
import { useToast } from '@/components/ui/use-toast';
import { useOrdemTimer } from '@/hooks/useOrdemTimer';

interface UseServicoTrackerOptions {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
}

export const useServicoTracker = (options: UseServicoTrackerOptions) => {
  const {
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onSubatividadeToggle,
    onServicoStatusChange,
    onSubatividadeSelecionadaToggle
  } = options;

  const [isShowingDetails, setIsShowingDetails] = useState(false);
  const { toast } = useToast();
  
  // Timer functionality integration
  const timer = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico: servico.tipo,
    isEtapaConcluida: servico.concluido
  });

  const toggleDetails = () => {
    setIsShowingDetails(prev => !prev);
  };

  // Determine if the current user has permission to modify this service
  const temPermissao = servico.funcionarioId === null || 
                      servico.funcionarioId === funcionarioId || 
                      !servico.funcionarioId;

  const handleSubatividadeToggle = (subatividadeId: string, checked: boolean) => {
    if (!temPermissao) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para modificar este serviço."
      });
      return;
    }

    if (onSubatividadeToggle) {
      onSubatividadeToggle(subatividadeId, checked);
    }
  };

  const handleServicoConcluidoToggle = (checked: boolean) => {
    if (!temPermissao) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para modificar este serviço."
      });
      return;
    }

    if (onServicoStatusChange) {
      onServicoStatusChange(checked, funcionarioId, funcionarioNome);
    }

    // If service is being completed and timer is running, stop it
    if (checked && (timer.isRunning || timer.isPaused)) {
      timer.handleFinish();
    }
  };

  const handleSubatividadeSelecionadaToggle = (subatividadeId: string, checked: boolean) => {
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
    // Export timer functionality
    timer
  };
};
