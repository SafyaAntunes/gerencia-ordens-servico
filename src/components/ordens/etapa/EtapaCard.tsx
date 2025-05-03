
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEtapaCard } from "./useEtapaCard";
import { getFuncionarios } from "@/services/funcionarioService";
import { Funcionario } from "@/types/funcionarios";
import { AtribuirFuncionarioDialog } from ".";
import { 
  EtapaHeader, 
  EtapaProgressDisplay, 
  EtapaTimerSection, 
  EtapaServicosLista 
} from "./components";
import { useSubatividadesVerifier } from "./hooks/useSubatividadesVerifier";
import { useEtapaStatusHandlers } from "./hooks/useEtapaStatusHandlers";

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
  const { todasSubatividadesConcluidas } = useSubatividadesVerifier();
  const { 
    isAtivo, 
    setIsAtivo, 
    isEtapaConcluida, 
    getEtapaStatus 
  } = useEtapaStatusHandlers(etapa, servicoTipo);
  
  const {
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido,
    handleReiniciarEtapa,
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    setDialogAction,
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

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas(servicos)) {
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
  const handleCustomTimerStart = (): boolean => {
    console.log("handleCustomTimerStart chamado em EtapaCard");
    // Modificado para permitir o início do timer mesmo com atribuição de funcionário
    handleIniciarTimer();
    return true; // Sempre retorna true para permitir que o timer inicie
  };

  return (
    <Card className="p-6 mb-4">
      <EtapaHeader 
        etapaNome={etapaNome}
        status={getEtapaStatus(etapaInfo)}
        isEtapaConcluida={isEtapaConcluida(etapaInfo)}
        funcionarioNome={etapaInfo?.funcionarioNome}
        podeReiniciar={podeAtribuirFuncionario() || podeTrabalharNaEtapa()}
        onReiniciar={() => handleReiniciarEtapa(onEtapaStatusChange)}
      />
      
      <EtapaProgressDisplay 
        servicos={servicos} 
        onAllServicosConcluidos={() => {
          if (onEtapaStatusChange && !isEtapaConcluida(etapaInfo)) {
            onEtapaStatusChange(etapa, true, funcionario?.id, funcionario?.nome);
          }
        }} 
      />
      
      {etapaComCronometro && (
        <EtapaTimerSection 
          ordemId={ordemId}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          etapa={etapa}
          tipoServico={servicoTipo}
          isEtapaConcluida={isEtapaConcluida(etapaInfo)}
          onEtapaConcluida={handleEtapaConcluida}
          onMarcarConcluido={handleMarcarConcluidoClick}
          onTimerStart={handleTimerStart}
          onCustomStart={handleCustomTimerStart}
        />
      )}
      
      <EtapaServicosLista
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
