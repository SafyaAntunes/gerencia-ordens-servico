import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Funcionario } from "@/types/funcionarios";
import { marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";
import {
  EtapaHeader,
  EtapaProgress,
  EtapaTimerSection,
  EtapaServiceList,
  EtapaAtribuirDialog
} from "./etapa-card";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos?: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    funcionarioId?: string;
    funcionarioNome?: string;
    servicoTipo?: TipoServico;
  };
  servicoTipo?: TipoServico;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  etapaInfo,
  servicoTipo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange
}: EtapaCardProps) {
  const { funcionario } = useAuth();
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [isAtivo, setIsAtivo] = useState(false);
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  
  // Inicializar o funcionário selecionado com o valor do backend
  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
      setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome || "");
    } else {
      // Se não houver funcionário atribuído, limpar a seleção
      setFuncionarioSelecionadoId("");
      setFuncionarioSelecionadoNome("");
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome]);
  
  // Verificar se o usuário tem permissão para atribuir funcionários
  const podeAtribuirFuncionario = funcionario?.nivelPermissao === 'admin' || 
                                 funcionario?.nivelPermissao === 'gerente';
  
  const podeTrabalharNaEtapa = () => {
    if (funcionario?.nivelPermissao === 'admin' || 
        funcionario?.nivelPermissao === 'gerente') {
      return true;
    }
    
    if (etapa === 'lavagem') {
      return funcionario?.especialidades?.includes('lavagem');
    }
    
    if (etapa === 'inspecao_inicial' || etapa === 'inspecao_final') {
      if (servicoTipo) {
        return funcionario?.especialidades?.includes(servicoTipo);
      }
      return false;
    }
    
    if (servicoTipo) {
      return funcionario?.especialidades?.includes(servicoTipo);
    }
    
    return funcionario?.especialidades?.includes(etapa);
  };
  
  // Fetch real funcionarios from database
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          setFuncionariosOptions(funcionariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar lista de funcionários");
      }
    };
    
    carregarFuncionarios();
  }, []);
  
  // Verificar se todas as subatividades dos serviços estão concluídas
  const todasSubatividadesConcluidas = () => {
    if (servicos.length === 0) return true;
    
    return servicos.every(servico => {
      const subatividades = servico.subatividades?.filter(s => s.selecionada) || [];
      return subatividades.length === 0 || subatividades.every(sub => sub.concluida);
    });
  };

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  const isEtapaConcluida = () => {
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    return etapaInfo?.concluido;
  };
  
  const getEtapaStatus = () => {
    if (isEtapaConcluida()) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  useEffect(() => {
    if (etapaInfo?.iniciado && !etapaInfo?.concluido) {
      setIsAtivo(true);
    } else {
      setIsAtivo(false);
    }
  }, [etapaInfo]);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas()) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      if (podeAtribuirFuncionario) {
        setDialogAction('finish');
        setAtribuirFuncionarioDialogOpen(true);
      } else {
        onEtapaStatusChange(
          etapa, 
          true, 
          funcionario?.id, 
          funcionario?.nome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }
    }
  };
  
  const handleMarcarConcluido = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return;
    }
    
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas()) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (podeAtribuirFuncionario) {
      setDialogAction('finish');
      setAtribuirFuncionarioDialogOpen(true);
    } else {
      if (onEtapaStatusChange) {
        onEtapaStatusChange(
          etapa, 
          true, 
          funcionario.id, 
          funcionario.nome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }
    }
  };
  
  const handleTimerStart = () => {
    console.log("handleTimerStart chamado em EtapaCard para:", {ordemId, etapa, servicoTipo});
    // Esta função será chamada quando o usuário clicar em iniciar
    // Ou após a confirmação de atribuição de funcionário
    setIsAtivo(true);
    return true; // Return true to indicate success
  };
  
  const handleIniciarTimer = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para iniciar uma etapa");
      return false;
    }

    if (podeAtribuirFuncionario) {
      setDialogAction('start');
      setAtribuirFuncionarioDialogOpen(true);
      return false;
    } else {
      // Próprio usuário inicia o timer
      return true; // EtapaTimer chamará handleTimerStart diretamente
    }
  };
  
  const handleReiniciarEtapa = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para reiniciar uma etapa");
      return;
    }
    
    if (!podeAtribuirFuncionario && !podeTrabalharNaEtapa()) {
      toast.error("Você não tem permissão para reiniciar esta etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        false,
        funcionario.id, 
        funcionario.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      toast.success("Etapa reaberta para continuação");
    }
  };
  
  const handleConfirmarAtribuicao = async () => {
    if (!funcionarioSelecionadoId) {
      toast.error("Selecione um funcionário para continuar");
      return;
    }

    try {
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

      if (dialogAction === 'start') {
        // Apenas inicia o timer com o funcionário selecionado
        handleTimerStart();
      } else if (dialogAction === 'finish' && onEtapaStatusChange) {
        // Marca a etapa como concluída com o funcionário selecionado
        onEtapaStatusChange(
          etapa, 
          true, 
          funcionarioSelecionadoId, 
          funcionarioSelecionadoNome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }

      toast.success("Funcionário atribuído com sucesso!");
    } catch (error) {
      console.error("Erro ao atribuir funcionário:", error);
      toast.error("Erro ao atribuir funcionário");
    } finally {
      setAtribuirFuncionarioDialogOpen(false);
    }
  };

  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  // Esta função será chamada pelo componente EtapaTimer quando o cronômetro for iniciado
  const handleCustomTimerStart = () => {
    console.log("handleCustomTimerStart chamado em EtapaCard");
    return handleIniciarTimer();
  };

  // Add a new handler for the Save Responsavel functionality
  const handleSaveResponsavel = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("Selecione um funcionário para salvar o responsável");
      return;
    }
    
    // Usar apenas o funcionário selecionado, sem fallback para o logado
    const funcId = funcionarioSelecionadoId;
    const funcNome = funcionarioSelecionadoNome;
    
    if (onEtapaStatusChange) {
      // Keep the current status (completed or not) but update the responsible person
      const etapaConcluida = isEtapaConcluida();
      
      onEtapaStatusChange(
        etapa,
        etapaConcluida,
        funcId,
        funcNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      toast.success(`Responsável ${funcNome} salvo com sucesso!`);
    }
  };

  const handleRemoverResponsavel = () => {
    if (onEtapaStatusChange) {
      // Manter o status atual mas remover o responsável
      const etapaConcluida = isEtapaConcluida();
      
      onEtapaStatusChange(
        etapa,
        etapaConcluida,
        "", // ID vazio para remover o responsável
        "", // Nome vazio para remover o responsável
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      // Limpar a seleção local
      setFuncionarioSelecionadoId("");
      setFuncionarioSelecionadoNome("");
      
      toast.success("Responsável removido com sucesso!");
    }
  };

  return (
    <Card className="p-6 mb-4">
      <EtapaHeader 
        etapaNome={etapaNome}
        status={getEtapaStatus()}
        isEtapaConcluida={isEtapaConcluida()}
        funcionarioNome={etapaInfo?.funcionarioNome}
        podeReiniciar={podeAtribuirFuncionario || podeTrabalharNaEtapa()}
        onReiniciar={handleReiniciarEtapa}
      />
      
      <EtapaProgress servicos={servicos} />
      
      {etapaComCronometro && (
        <EtapaTimerSection
          ordemId={ordemId}
          funcionarioId={etapaInfo?.funcionarioId || ""}
          funcionarioNome={etapaInfo?.funcionarioNome || ""}
          etapa={etapa}
          tipoServico={servicoTipo}
          isEtapaConcluida={isEtapaConcluida()}
          onEtapaConcluida={handleEtapaConcluida}
          onMarcarConcluido={handleMarcarConcluido}
          onTimerStart={handleTimerStart}
          onCustomStart={handleCustomTimerStart}
          onSaveResponsavel={handleSaveResponsavel}
          onRemoverResponsavel={handleRemoverResponsavel}
        />
      )}
      
      <EtapaServiceList
        servicos={servicos}
        ordemId={ordemId}
        funcionarioId={etapaInfo?.funcionarioId || ""}
        funcionarioNome={etapaInfo?.funcionarioNome || ""}
        etapa={etapa}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
      />
      
      <EtapaAtribuirDialog
        open={atribuirFuncionarioDialogOpen}
        onOpenChange={setAtribuirFuncionarioDialogOpen}
        dialogAction={dialogAction}
        funcionarioOptions={funcionariosOptions}
        currentFuncionarioId={funcionario?.id}
        currentFuncionarioNome={funcionario?.nome}
        selectedFuncionarioId={funcionarioSelecionadoId}
        onFuncionarioChange={handleFuncionarioChange}
        onConfirm={handleConfirmarAtribuicao}
      />
    </Card>
  );
}
