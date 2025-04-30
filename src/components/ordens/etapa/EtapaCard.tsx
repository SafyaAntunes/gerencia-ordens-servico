
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEtapaCard } from "./useEtapaCard";
import { 
  EtapaStatus,
  EtapaProgresso,
  EtapaConcluiButton,
  EtapaServicos,
  EtapaTimer,
  AtribuirFuncionarioDialog
} from ".";
import { Funcionario } from "@/types/funcionarios";
import { getFuncionarios } from "@/services/funcionarioService";

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
  const {
    isAtivo,
    setIsAtivo,
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido,
    isEtapaConcluida,
    getEtapaStatus,
    handleReiniciarEtapa,
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange,
    handleConfirmarAtribuicao
  } = useEtapaCard(etapa, servicoTipo);
  
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
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas()) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Directly call onEtapaStatusChange without dialog
      onEtapaStatusChange(
        etapa, 
        true, 
        funcionario?.id, 
        funcionario?.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };
  
  useEffect(() => {
    if (etapaInfo?.iniciado && !etapaInfo?.concluido) {
      setIsAtivo(true);
    } else {
      setIsAtivo(false);
    }
  }, [etapaInfo, setIsAtivo]);
  
  const handleMarcarConcluidoClick = () => {
    // Verificar se todas as subatividades estão concluídas antes de permitir marcar a etapa como concluída
    if (!todasSubatividadesConcluidas()) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (handleMarcarConcluido(servicos) && onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        true, 
        funcionario?.id, 
        funcionario?.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };

  // Esta função será chamada pelo componente EtapaTimer quando o cronômetro for iniciado
  const handleCustomTimerStart = () => {
    console.log("handleCustomTimerStart chamado em EtapaCard");
    const iniciarResult = handleIniciarTimer();
    return iniciarResult; // Retorna true se o timer deve ser iniciado, false caso contrário
  };

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        <EtapaStatus 
          status={getEtapaStatus(etapaInfo)} 
          funcionarioNome={etapaInfo?.funcionarioNome}
        />
      </div>
      
      <EtapaProgresso 
        servicos={servicos} 
        onAllServicosConcluidos={() => {
          if (onEtapaStatusChange && !isEtapaConcluida(etapaInfo)) {
            onEtapaStatusChange(etapa, true, funcionario?.id, funcionario?.nome);
          }
        }} 
      />
      
      {etapaComCronometro && (
        <div className="p-4 border rounded-md mb-4">
          <EtapaTimer
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            etapa={etapa}
            onFinish={handleEtapaConcluida}
            isEtapaConcluida={isEtapaConcluida(etapaInfo)}
            onStart={handleTimerStart}
            onCustomStart={handleCustomTimerStart}
            tipoServico={servicoTipo}
          />
          
          <EtapaConcluiButton 
            isConcluida={isEtapaConcluida(etapaInfo)} 
            onClick={handleMarcarConcluidoClick} 
          />
        </div>
      )}
      
      <EtapaServicos
        servicos={servicos}
        ordemId={ordemId}
        funcionarioId={funcionarioId}
        funcionarioNome={funcionarioNome}
        etapa={etapa}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
      />
      
      <AtribuirFuncionarioDialog
        open={atribuirFuncionarioDialogOpen}
        onOpenChange={setAtribuirFuncionarioDialogOpen}
        dialogAction={dialogAction}
        funcionarioOptions={funcionariosOptions}
        currentFuncionarioId={funcionario?.id}
        currentFuncionarioNome={funcionario?.nome}
        selectedFuncionarioId={funcionarioSelecionadoId}
        onFuncionarioChange={handleFuncionarioChange}
        onConfirm={() => handleConfirmarAtribuicao(onEtapaStatusChange)}
      />
    </Card>
  );
}
