
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import OrdemCronometro from "../OrdemCronometro";
import { useEtapaCard } from "./useEtapaCard";
import { 
  AtribuirFuncionarioDialog,
  EtapaStatus,
  EtapaProgresso,
  EtapaConcluiButton,
  EtapaServicos
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
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    setDialogAction,
    funcionariosOptions,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    handleFuncionarioChange,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido
  } = useEtapaCard(etapa, servicoTipo);
  
  const isEtapaConcluida = () => {
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    return etapaInfo?.concluido;
  };

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
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
  
  const handleConfirmarAtribuicao = () => {
    if (onEtapaStatusChange) {
      const funcId = funcionarioSelecionadoId || funcionario?.id;
      const funcNome = funcionarioSelecionadoNome || funcionario?.nome;
      
      if (dialogAction === 'start') {
        // Apenas inicia o timer com o funcionário selecionado
        handleTimerStart();
      } else if (dialogAction === 'finish') {
        // Marca a etapa como concluída com o funcionário selecionado
        onEtapaStatusChange(
          etapa, 
          true, 
          funcId, 
          funcNome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }
    }
    setAtribuirFuncionarioDialogOpen(false);
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
  }, [etapaInfo, setIsAtivo]);

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        <EtapaStatus 
          status={getEtapaStatus()} 
          funcionarioNome={etapaInfo?.funcionarioNome}
          onReiniciar={handleReiniciarEtapa}
          podeReiniciar={(podeAtribuirFuncionario || podeTrabalharNaEtapa()) && isEtapaConcluida()}
        />
      </div>
      
      <EtapaProgresso 
        servicos={servicos} 
        onAllServicosConcluidos={() => {
          if (onEtapaStatusChange && !isEtapaConcluida()) {
            onEtapaStatusChange(etapa, true, funcionario?.id, funcionario?.nome);
          }
        }} 
      />
      
      {etapaComCronometro && (
        <div className="p-4 border rounded-md mb-4">
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            etapa={etapa}
            onFinish={handleEtapaConcluida}
            isEtapaConcluida={isEtapaConcluida()}
            onStart={handleTimerStart}
            onCustomStart={handleIniciarTimer}
            tipoServico={servicoTipo}
          />
          
          <EtapaConcluiButton 
            isConcluida={isEtapaConcluida()} 
            onClick={handleMarcarConcluido} 
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
        isOpen={atribuirFuncionarioDialogOpen} 
        onOpenChange={setAtribuirFuncionarioDialogOpen}
        onConfirm={handleConfirmarAtribuicao}
        funcionarioAtual={{ id: funcionario?.id || "", nome: funcionario?.nome || "" }}
        funcionariosOptions={funcionariosOptions}
        onFuncionarioChange={handleFuncionarioChange}
        dialogAction={dialogAction}
      />
    </Card>
  );
}
