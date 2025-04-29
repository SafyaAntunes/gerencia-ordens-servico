
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
  EtapaTimer
} from ".";

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
    handleReiniciarEtapa
  } = useEtapaCard(etapa, servicoTipo);
  
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

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        <EtapaStatus 
          status={getEtapaStatus(etapaInfo)} 
          funcionarioNome={etapaInfo?.funcionarioNome}
          onReiniciar={() => handleReiniciarEtapa(onEtapaStatusChange)}
          podeReiniciar={(podeAtribuirFuncionario || podeTrabalharNaEtapa()) && isEtapaConcluida(etapaInfo)}
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
            onCustomStart={handleIniciarTimer}
            tipoServico={servicoTipo}
          />
          
          <EtapaConcluiButton 
            isConcluida={isEtapaConcluida(etapaInfo)} 
            onClick={() => {
              if (handleMarcarConcluido() && onEtapaStatusChange) {
                onEtapaStatusChange(
                  etapa, 
                  true, 
                  funcionario?.id, 
                  funcionario?.nome,
                  (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
                );
              }
            }} 
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
    </Card>
  );
}
