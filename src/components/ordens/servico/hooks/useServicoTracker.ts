
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import { useAuth } from "@/hooks/useAuth";
import { UseServicoTrackerProps, UseServicoTrackerResult, ServicoStatus } from "./types/servicoTrackerTypes";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { getServicoStatus } from "./utils/servicoTrackerUtils";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [responsavelSelecionadoId, setResponsavelSelecionadoId] = useState<string>(servico.funcionarioId || funcionario?.id || "");
  const [isSavingResponsavel, setIsSavingResponsavel] = useState(false);
  const [lastSavedResponsavelId, setLastSavedResponsavelId] = useState<string>(servico.funcionarioId || "");
  const [lastSavedResponsavelNome, setLastSavedResponsavelNome] = useState<string>(servico.funcionarioNome || "");
  
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
    },
    isEtapaConcluida: servico.concluido
  });
  
  // Inicializar o responsável selecionado com o valor do serviço
  useEffect(() => {
    if (servico.funcionarioId) {
      setResponsavelSelecionadoId(servico.funcionarioId);
      setLastSavedResponsavelId(servico.funcionarioId);
      setLastSavedResponsavelNome(servico.funcionarioNome || "");
    }
  }, [servico.funcionarioId, servico.funcionarioNome]);
  
  // Função para salvar o responsável do serviço
  const handleSaveResponsavel = async () => {
    if (!responsavelSelecionadoId) {
      toast.error("É necessário selecionar um responsável para salvar");
      return;
    }
    
    if (!ordemId) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    setIsSavingResponsavel(true);
    
    try {
      // Buscar o funcionário selecionado para obter o nome
      const funcionarioSelecionado = funcionariosOptions.find(f => f.id === responsavelSelecionadoId);
      const funcionarioSelecionadoNome = funcionarioSelecionado?.nome || "";
      
      // Obter documento atual da ordem
      const ordemRef = doc(db, "ordens_servico", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem de serviço não encontrada");
        setIsSavingResponsavel(false);
        return;
      }
      
      const dadosAtuais = ordemDoc.data();
      const servicosAtuais = dadosAtuais.servicos || [];
      
      // Modificação aqui: Atualizar apenas o serviço específico pelo tipo
      // Criar array atualizado de serviços
      const servicosAtualizados = servicosAtuais.map((s: any) => {
        // Comparar pelo tipo EXATO do serviço atual, sem afetar outros
        if (s.tipo === servico.tipo) {
          return {
            ...s,
            funcionarioId: responsavelSelecionadoId,
            funcionarioNome: funcionarioSelecionadoNome
          };
        }
        return s;
      });
      
      // Atualizar a ordem
      await updateDoc(ordemRef, {
        servicos: servicosAtualizados
      });
      
      // Atualizar estados locais
      setLastSavedResponsavelId(responsavelSelecionadoId);
      setLastSavedResponsavelNome(funcionarioSelecionadoNome);
      
      // Atualizar também no callback se existir
      if (onServicoStatusChange) {
        // Manter o status de conclusão atual, apenas atualizar o responsável
        onServicoStatusChange(servico.concluido, responsavelSelecionadoId, funcionarioSelecionadoNome);
      }
      
      toast.success(`Responsável ${funcionarioSelecionadoNome} salvo com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Não foi possível salvar o responsável");
    } finally {
      setIsSavingResponsavel(false);
    }
  };
  
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
    // Verificar se há um responsável antes de iniciar
    if (!responsavelSelecionadoId && !lastSavedResponsavelId) {
      toast.error("Selecione e salve um responsável antes de iniciar o serviço");
      return;
    }
    
    // Se tiver um responsável selecionado mas não salvo, perguntar se quer salvar
    if (responsavelSelecionadoId !== lastSavedResponsavelId) {
      toast.error("Salve o responsável antes de iniciar o serviço");
      return;
    }
    
    handleStart();
  };
  
  const handleFinish = () => {
    finishTimer();
  };
  
  const handleMarcarConcluido = () => {
    // Verificar se há um responsável salvo
    if (!lastSavedResponsavelId) {
      toast.error("É necessário selecionar e salvar um responsável antes de concluir o serviço");
      return;
    }
    
    // Se o timer ainda estiver rodando, finalizar primeiro
    if (isRunning || isPaused) {
      finishTimer();
    }
    
    if (onServicoStatusChange) {
      // Usar o responsável salvo
      onServicoStatusChange(true, lastSavedResponsavelId, lastSavedResponsavelNome);
    }
  };
  
  const handleReiniciarServico = () => {
    // Desativado conforme solicitado
    toast.info("A funcionalidade de reiniciar foi desativada");
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
    handleReiniciarServico,
    responsavelSelecionadoId,
    setResponsavelSelecionadoId,
    handleSaveResponsavel,
    isSavingResponsavel,
    lastSavedResponsavelId,
    lastSavedResponsavelNome
  };
}
