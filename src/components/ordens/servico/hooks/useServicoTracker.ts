
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import { useAuth } from "@/hooks/useAuth";
import { UseServicoTrackerProps, UseServicoTrackerResult, ServicoStatus } from "./types/servicoTrackerTypes";
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
  const [responsavelSelecionadoId, setResponsavelSelecionadoId] = useState(funcionarioId || '');
  const [isSavingResponsavel, setIsSavingResponsavel] = useState(false);
  
  const temPermissao = canEditOrder(ordemId);
  
  // Determine service status based on completed state
  const servicoStatus: ServicoStatus = getServicoStatus(false, false, servico.concluido);
  
  const completedSubatividades = servico.subatividades?.filter(sub => sub.concluida).length || 0;
  const totalSubatividades = servico.subatividades?.filter(sub => sub.selecionada).length || 0;
  
  // Ensure progressPercentage is a number
  const progressPercentage = totalSubatividades > 0 ? Math.round((completedSubatividades / totalSubatividades) * 100) : 0;
  
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
    console.log('Toggle subatividade:', { subatividadeId, checked });
    if (onSubatividadeToggle) {
      onSubatividadeToggle(subatividadeId, checked);
    }
  };
  
  const handleMarcarConcluido = () => {
    if (onServicoStatusChange) {
      // Usar o responsável selecionado ou o funcionário atual
      const funcId = responsavelSelecionadoId || funcionario?.id;
      const funcNome = funcionariosOptions.find(f => f.id === funcId)?.nome || funcionario?.nome;
      
      onServicoStatusChange(true, funcId, funcNome);
      toast.success("Serviço marcado como concluído");
    }
  };

  const handleSaveResponsavel = async () => {
    setIsSavingResponsavel(true);
    try {
      // Simulação de salvamento de responsável (aqui seria uma chamada de API real)
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Responsável atribuído com sucesso");
      setIsSavingResponsavel(false);
      return Promise.resolve();
    } catch (error) {
      toast.error("Erro ao atribuir responsável");
      setIsSavingResponsavel(false);
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    // Inicializar o responsável selecionado com o funcionário atual, se não houver um
    if (!responsavelSelecionadoId && funcionario?.id) {
      setResponsavelSelecionadoId(funcionario.id);
    }
  }, [funcionario, responsavelSelecionadoId]);

  // Return tracking state
  return {
    isOpen,
    setIsOpen,
    funcionariosOptions,
    temPermissao,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    subatividadesFiltradas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleMarcarConcluido,
    responsavelSelecionadoId,
    setResponsavelSelecionadoId,
    handleSaveResponsavel,
    isSavingResponsavel,
    lastSavedResponsavelId: funcionarioId || '',
    lastSavedResponsavelNome: funcionarioNome || '',
    // Para compatibilidade com a interface existente
    handleReiniciarServico: () => {},
    state: {
      isRunning: false,
      isPaused: false,
      time: 0,
      concluido: servico.concluido,
      status: servicoStatus,
      pausas: [],
      progressPercentage,
      tipoServico: servico.tipo,
      completedSubatividades,
      totalSubatividades
    },
    operations: {
      start: () => {},
      pause: () => {},
      resume: () => {},
      stop: () => {},
      complete: handleMarcarConcluido,
      reset: () => {}
    },
    registerPausa: () => {},
    finalizarPausa: () => {},
    handleAssign: () => {}
  };
}
