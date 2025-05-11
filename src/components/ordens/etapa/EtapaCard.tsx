import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";
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
  
  // Atualizar funcionário selecionado quando etapaInfo mudar
  useEffect(() => {
    if (etapaInfo?.funcionarioId && etapaInfo.funcionarioId !== funcionarioSelecionadoId) {
      handleFuncionarioChange(etapaInfo.funcionarioId);
    }
  }, [etapaInfo?.funcionarioId, funcionarioSelecionadoId, handleFuncionarioChange]);
  
  // Gerenciamento do responsável com hook personalizado
  const {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome,
    isSaving
  } = useEtapaResponsavel({
    etapa,
    servicoTipo,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    isEtapaConcluida: isEtapaConcluida(etapaInfo),
    onEtapaStatusChange,
    etapaInfo,
    ordemId
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
      const useId = funcionarioSelecionadoId || funcionario?.id;
      const useNome = funcionarioSelecionadoNome || funcionario?.nome;

      onEtapaStatusChange(
        etapa, 
        true, 
        useId, 
        useNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };

  // MODIFICADO: Não mostrar cronômetro para nenhuma etapa (lavagem, inspeção inicial e inspeção final)
  // Agora usaremos apenas o cronômetro do serviço para todas essas etapas
  const etapaComCronometro = [].includes(etapa);
  
  // Verificar se este card específico precisa de cronômetro
  const mostrarCronometro = () => {
    // Se não for uma etapa que pode ter cronômetro, não mostrar
    if (!etapaComCronometro) return false;
    
    // Como todas as etapas foram removidas da lista etapaComCronometro,
    // esta função sempre retornará false
    return false;
  };

  return (
    <Card className="p-6 mb-4">
      <EtapaHeader 
        etapaNome={etapaNome}
        status={getEtapaStatus(etapaInfo)}
        isEtapaConcluida={isEtapaConcluida(etapaInfo)}
        funcionarioNome={etapaInfo?.funcionarioNome || "Não definido"}
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
          ordemId={ordemId}
          etapa={etapa}
          servicoTipo={servicoTipo}
          funcionarioSelecionadoId={funcionarioSelecionadoId}
          funcionariosOptions={funcionariosOptions}
          isEtapaConcluida={isEtapaConcluida(etapaInfo)}
          onFuncionarioChange={handleFuncionarioChange}
          onSaveResponsavel={handleSaveResponsavel}
          isSaving={isSaving}
        />
      )}
      
      {/* MODIFICADO: Usar a função mostrarCronometro para decidir se exibe o cronômetro */}
      {mostrarCronometro() && (
        <EtapaTimerSection 
          ordemId={ordemId}
          funcionarioId={lastSavedFuncionarioId || funcionarioSelecionadoId || funcionarioId}
          funcionarioNome={lastSavedFuncionarioNome || funcionarioSelecionadoNome || funcionarioNome}
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
        funcionarioId={lastSavedFuncionarioId || funcionarioSelecionadoId || funcionarioId}
        funcionarioNome={lastSavedFuncionarioNome || funcionarioSelecionadoNome || funcionarioNome}
        etapa={etapa}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
      />
    </Card>
  );
}
