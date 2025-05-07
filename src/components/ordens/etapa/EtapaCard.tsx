
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEtapaCard } from "./useEtapaCard";
import { 
  EtapaHeader, 
  EtapaProgressDisplay, 
  EtapaTimerSection, 
  EtapaServicosLista,
  FuncionarioSelector
} from "./components";
import { useSubatividadesVerifier } from "./hooks/useSubatividadesVerifier";
import { useEtapaStatusHandlers } from "./hooks/useEtapaStatusHandlers";
import { useFuncionarioSelection } from "./hooks/useFuncionarioSelection";
import { useEtapaResponsavel } from "./hooks/useEtapaResponsavel";

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
    handleMarcarConcluido
  } = useEtapaCard(etapa, servicoTipo);
  
  // Carregando funcionário selecionado com log para debug
  console.log("EtapaCard - Carregando com etapaInfo:", etapaInfo);
  
  // Estado para armazenar o ID e nome do funcionário selecionado utilizando o hook personalizado
  const {
    funcionariosOptions,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange
  } = useFuncionarioSelection({
    etapaInfo,
    funcionarioId,
    funcionarioNome
  });
  
  // Log para debug dos valores atuais
  console.log("Funcionário selecionado:", {
    id: funcionarioSelecionadoId,
    nome: funcionarioSelecionadoNome,
    etapaInfoId: etapaInfo?.funcionarioId,
    etapaInfoNome: etapaInfo?.funcionarioNome
  });
  
  // Gerenciamento do responsável com hook personalizado
  const {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome
  } = useEtapaResponsavel({
    etapa,
    servicoTipo,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    isEtapaConcluida,
    onEtapaStatusChange,
    etapaInfo,
    ordemId // Passar o ordemId para o hook
  });
  
  // Atualizar estado ativo do timer baseado no etapaInfo
  useEffect(() => {
    if (etapaInfo?.iniciado && !etapaInfo?.concluido) {
      setIsAtivo(true);
    } else {
      setIsAtivo(false);
    }
  }, [etapaInfo, setIsAtivo]);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas(servicos)) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Usa o ID e nome do funcionário selecionado ou o último salvo
      const useId = funcionarioSelecionadoId || lastSavedFuncionarioId || funcionario?.id;
      const useNome = funcionarioSelecionadoNome || lastSavedFuncionarioNome || funcionario?.nome;
      
      onEtapaStatusChange(
        etapa, 
        true, 
        useId, 
        useNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  // Função para exibir o nome do responsável atual (selecionado, etapaInfo ou último salvo)
  const getResponsavelDisplayName = () => {
    if (funcionarioSelecionadoNome) return funcionarioSelecionadoNome;
    if (etapaInfo?.funcionarioNome) return etapaInfo.funcionarioNome;
    if (lastSavedFuncionarioNome) return lastSavedFuncionarioNome;
    return "Não definido";
  };

  return (
    <Card className="p-6 mb-4">
      <EtapaHeader 
        etapaNome={etapaNome}
        status={getEtapaStatus(etapaInfo)}
        isEtapaConcluida={isEtapaConcluida(etapaInfo)}
        funcionarioNome={getResponsavelDisplayName()}
        podeReiniciar={false}
        onReiniciar={() => {}}
      />
      
      <EtapaProgressDisplay 
        servicos={servicos} 
        onAllServicosConcluidos={() => {
          // Não fazer nada automático, deixar usuário clicar em concluir
        }} 
      />
      
      {!isEtapaConcluida(etapaInfo) && (
        <FuncionarioSelector
          funcionarioSelecionadoId={funcionarioSelecionadoId}
          funcionariosOptions={funcionariosOptions}
          isEtapaConcluida={isEtapaConcluida(etapaInfo)}
          onFuncionarioChange={handleFuncionarioChange}
          onSaveResponsavel={handleSaveResponsavel}
          lastSavedFuncionarioId={lastSavedFuncionarioId}
          lastSavedFuncionarioNome={lastSavedFuncionarioNome}
        />
      )}
      
      {etapaComCronometro && (
        <EtapaTimerSection 
          ordemId={ordemId}
          funcionarioId={funcionarioSelecionadoId || lastSavedFuncionarioId || funcionarioId}
          funcionarioNome={funcionarioSelecionadoNome || lastSavedFuncionarioNome || funcionarioNome}
          etapa={etapa}
          tipoServico={servicoTipo}
          isEtapaConcluida={isEtapaConcluida(etapaInfo)}
          onEtapaConcluida={handleEtapaConcluida}
          onMarcarConcluido={handleMarcarConcluidoClick}
          onTimerStart={handleTimerStart}
          onCustomStart={handleCustomTimerStart}
          onSaveResponsavel={handleSaveResponsavel}
        />
      )}
      
      <EtapaServicosLista
        servicos={servicos}
        ordemId={ordemId}
        funcionarioId={funcionarioSelecionadoId || lastSavedFuncionarioId || funcionarioId}
        funcionarioNome={funcionarioSelecionadoNome || lastSavedFuncionarioNome || funcionarioNome}
        etapa={etapa}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
      />
    </Card>
  );
}
