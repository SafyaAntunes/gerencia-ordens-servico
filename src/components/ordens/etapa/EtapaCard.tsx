
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
    isEtapaConcluida,
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
  
  // MODIFICADO: Remover o efeito de conclusão automática para cabeçote em retífica
  // O código anterior marcava automaticamente a etapa como concluída quando todos os serviços estavam concluídos
  // O que causava o problema de marcar cabeçote como concluído ao concluir o bloco
  // Agora cada serviço deve ser concluído individualmente pelo usuário
  
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

  // MODIFICADO: Adicionar uma verificação se deve mostrar o cronômetro
  // Apenas mostrar para lavagem, inspeção inicial e inspeção final
  // E apenas quando não tiver serviço específico associado ou se esse serviço precisar do cronômetro
  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  // Verificar se este card específico precisa de cronômetro
  // Se for um serviço específico dentro de uma etapa, verificar as configurações do serviço
  const mostrarCronometro = () => {
    // Se não for uma etapa que pode ter cronômetro, não mostrar
    if (!etapaComCronometro) return false;
    
    // Se for serviço específico (retifica-bloco, retifica-cabecote, etc), não mostrar cronômetro
    if (servicoTipo && etapa !== 'lavagem' && etapa !== 'inspecao_inicial' && etapa !== 'inspecao_final') {
      return false;
    }
    
    // Se for um serviço específico de inspeção/lavagem, mostrar cronômetro
    if ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo) {
      return true;
    }
    
    // Por padrão, mostrar cronômetro para as etapas gerais de lavagem, inspeção inicial e inspeção final
    return etapaComCronometro;
  };
  
  // Função para exibir o nome do responsável atual (selecionado, etapaInfo ou último salvo)
  const getResponsavelDisplayName = () => {
    if (lastSavedFuncionarioNome) return lastSavedFuncionarioNome;
    if (etapaInfo?.funcionarioNome) return etapaInfo.funcionarioNome;
    if (funcionarioSelecionadoNome) return funcionarioSelecionadoNome;
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
