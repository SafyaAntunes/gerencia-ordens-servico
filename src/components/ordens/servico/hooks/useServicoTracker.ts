import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Servico, SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";
import { Funcionario } from "@/types/funcionarios";
import { useAuth } from "@/hooks/useAuth";
import { UseServicoTrackerProps, UseServicoTrackerResult, ServicoStatus } from "./types/servicoTrackerTypes";
import { useFuncionariosDisponibilidade } from "@/hooks/useFuncionariosDisponibilidade";
import { marcarFuncionarioEmServico, liberarFuncionarioDeServico } from "@/services/funcionarioEmServicoService";

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
  const { funcionariosStatus } = useFuncionariosDisponibilidade();
  const [isOpen, setIsOpen] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [responsavelSelecionadoId, setResponsavelSelecionadoId] = useState(servico.funcionarioId || funcionarioId || '');
  const [isSavingResponsavel, setIsSavingResponsavel] = useState(false);
  
  // Determinar o status do serviço com base no estado atual
  const initialStatus: ServicoStatus = servico.concluido 
    ? "concluido" 
    : (servico.status as ServicoStatus) || "nao_iniciado";
    
  const [status, setStatus] = useState<ServicoStatus>(initialStatus);
  
  const temPermissao = canEditOrder(ordemId);
  
  // Determine service status based on completed state
  const servicoStatus: ServicoStatus = status;
  
  const completedSubatividades = servico.subatividades?.filter(sub => sub.concluida).length || 0;
  const totalSubatividades = servico.subatividades?.filter(sub => sub.selecionada).length || 0;
  
  // Ensure progressPercentage is a number
  const progressPercentage = totalSubatividades > 0 ? Math.round((completedSubatividades / totalSubatividades) * 100) : 0;
  
  const subatividadesFiltradas = servico.subatividades?.filter(sub => sub.selecionada) || [];
  
  const handleLoadFuncionarios = useCallback(async () => {
    try {
      // MODIFICADO: Usar diretamente funcionariosStatus em vez de buscar de novo
      const funcionariosFiltrados = funcionariosStatus.filter(f => {
        // Sempre incluir o funcionário atual do serviço
        if (f.id === servico.funcionarioId) {
          return true;
        }
        
        // Verificar se está ativo e disponível
        return f.status === 'disponivel' && f.ativo !== false;
      });
      
      setFuncionariosOptions(funcionariosFiltrados);
      console.log("Funcionários filtrados para selection:", funcionariosFiltrados.length);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast.error("Erro ao carregar lista de funcionários");
    }
  }, [funcionariosStatus, servico.funcionarioId]);
  
  const handleSubatividadeToggle = (subatividadeId: string, checked: boolean) => {
    console.log('Toggle subatividade:', { subatividadeId, checked });
    if (onSubatividadeToggle) {
      onSubatividadeToggle(subatividadeId, checked);
    }
  };
  
  const handleMarcarConcluido = useCallback(async () => {
    if (onServicoStatusChange) {
      // Usar o responsável selecionado ou o funcionário atual
      const funcId = responsavelSelecionadoId || funcionario?.id;
      const funcNome = funcionariosOptions.find(f => f.id === funcId)?.nome || funcionario?.nome;
      
      // Se o serviço estava em andamento, precisamos liberar o funcionário
      if (servico.status === 'em_andamento' && servico.funcionarioId) {
        await liberarFuncionarioDeServico(servico.funcionarioId);
      }
      
      setStatus("concluido");
      onServicoStatusChange(true, funcId, funcNome);
      toast.success("Serviço marcado como concluído");
    }
  }, [responsavelSelecionadoId, funcionario, funcionariosOptions, onServicoStatusChange, servico.status, servico.funcionarioId]);

  const handleStatusChange = useCallback(async (newStatus: ServicoStatus) => {
    if (!responsavelSelecionadoId && (newStatus === 'em_andamento' || newStatus === 'concluido')) {
      toast.error("Selecione um funcionário para continuar");
      return;
    }
    
    try {
      // Se estamos alterando para "em_andamento", verificar se o funcionário está disponível
      if (newStatus === 'em_andamento' && servicoStatus !== 'em_andamento') {
        // Verificar se o funcionário selecionado está disponível (a menos que seja o mesmo já atribuído)
        if (responsavelSelecionadoId !== servico.funcionarioId) {
          const funcionarioSelecionado = funcionariosStatus.find(f => f.id === responsavelSelecionadoId);
          
          // MODIFICADO: Verificar status do funcionário e dar aviso mais claro
          if (funcionarioSelecionado && funcionarioSelecionado.status === 'ocupado') {
            // Mostrar detalhes de onde o funcionário está ocupado
            let mensagem = `O funcionário ${funcionarioSelecionado.nome} já está ocupado`;
            
            if (funcionarioSelecionado.atividadeAtual?.ordemNome) {
              mensagem += ` na ordem ${funcionarioSelecionado.atividadeAtual.ordemNome}`;
            }
            
            toast.error(mensagem);
            return;
          }
          
          // Marcar funcionário como ocupado
          await marcarFuncionarioEmServico(
            responsavelSelecionadoId,
            ordemId,
            etapa || 'retifica',
            servico.tipo
          );
        }
      }
      
      // Se o status está passando de "em_andamento" para outro estado, liberar o funcionário
      if (servicoStatus === 'em_andamento' && newStatus !== 'em_andamento') {
        // Liberar o funcionário atual se houver um
        if (servico.funcionarioId) {
          await liberarFuncionarioDeServico(servico.funcionarioId);
        }
      }
      
      if (newStatus === "concluido") {
        handleMarcarConcluido();
      } else {
        setStatus(newStatus);
        
        // Se estamos mudando para um status diferente de concluído, chamar onServicoStatusChange com concluido=false
        if (onServicoStatusChange) {
          const funcId = responsavelSelecionadoId || servico.funcionarioId;
          const funcNome = funcionariosOptions.find(f => f.id === funcId)?.nome || servico.funcionarioNome;
          
          if (newStatus === 'em_andamento') {
            onServicoStatusChange(false, funcId, funcNome);
          } else {
            onServicoStatusChange(false, servico.funcionarioId, servico.funcionarioNome);
          }
        }
        
        toast.success(`Status do serviço alterado para ${
          newStatus === "em_andamento" ? "Em Andamento" : 
          newStatus === "pausado" ? "Pausado" : 
          "Não Iniciado"
        }`);
      }
    } catch (error) {
      console.error("Erro ao mudar status:", error);
      toast.error("Erro ao alterar status do serviço");
    }
  }, [
    responsavelSelecionadoId, 
    servicoStatus, 
    funcionariosStatus, 
    ordemId, 
    etapa, 
    servico.tipo,
    servico.funcionarioId, 
    servico.funcionarioNome, 
    funcionariosOptions, 
    handleMarcarConcluido, 
    onServicoStatusChange
  ]);

  const handleSaveResponsavel = async () => {
    setIsSavingResponsavel(true);
    try {
      // Validar se o funcionário selecionado está disponível
      if (!servico.funcionarioId || responsavelSelecionadoId !== servico.funcionarioId) {
        const funcionarioSelecionado = funcionariosStatus.find(f => f.id === responsavelSelecionadoId);
        
        if (funcionarioSelecionado && funcionarioSelecionado.status !== 'disponivel') {
          toast.error(`O funcionário ${funcionarioSelecionado.nome} já está ocupado`);
          return Promise.reject(new Error("Funcionário ocupado"));
        }
      }
      
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

  // Atualizar a lista de funcionários quando o componente montar ou quando houver mudanças em funcionariosStatus
  useEffect(() => {
    handleLoadFuncionarios();
  }, [handleLoadFuncionarios, funcionariosStatus]);

  // Update os estados quando o servico mudar
  useEffect(() => {
    // Atualizar o status baseado no serviço
    const newStatus: ServicoStatus = servico.concluido 
      ? "concluido" 
      : (servico.status as ServicoStatus) || "nao_iniciado";
    
    setStatus(newStatus);
    
    // Atualizar o responsável selecionado com base no serviço
    if (servico.funcionarioId) {
      setResponsavelSelecionadoId(servico.funcionarioId);
    }
  }, [servico]);

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
    lastSavedResponsavelId: servico.funcionarioId || funcionarioId || '',
    lastSavedResponsavelNome: servico.funcionarioNome || funcionarioNome || '',
    handleStatusChange,
    setStatus,
    // Para compatibilidade com a interface existente
    handleReiniciarServico: () => {},
    state: {
      isRunning: status === "em_andamento",
      isPaused: status === "pausado",
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
      start: () => handleStatusChange("em_andamento"),
      pause: () => handleStatusChange("pausado"),
      resume: () => handleStatusChange("em_andamento"),
      stop: () => {},
      complete: handleMarcarConcluido,
      reset: () => {}
    },
    registerPausa: () => {},
    finalizarPausa: () => {},
    handleAssign: () => {}
  };
}
