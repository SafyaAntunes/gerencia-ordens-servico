import React, { useState, useEffect, useCallback, useMemo } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, EtapaOS, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyServices } from "./EmptyServices";
import { EtapasSelector } from "./EtapasSelector";
import { EtapaContent } from "./EtapaContent";
import { useEtapasProgress } from "./useEtapasProgress";
import { marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";

// Objeto para armazenar timestamps de notificações para evitar duplicatas em um curto período
const notificationTimestamps: Record<string, number> = {};

// Função para verificar se uma notificação similar já foi mostrada recentemente
const shouldShowNotification = (message: string, cooldownMs = 3000): boolean => {
  const now = Date.now();
  const lastShown = notificationTimestamps[message] || 0;
  
  if (now - lastShown > cooldownMs) {
    notificationTimestamps[message] = now;
    return true;
  }
  
  return false;
};

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

// Memoized component for better performance
const EtapasTracker = React.memo(({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  // Incluir todas as etapas na lista
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaOS | null>(null);
  const [selectedServicoTipo, setSelectedServicoTipo] = useState<TipoServico | null>(null);
  const { funcionario } = useAuth();
  const { progressoTotal, calcularProgressoTotal } = useEtapasProgress();

  // Use memoization for expensive calculations
  const verificarEtapasDisponiveis = useCallback(() => {
    const temMontagem = ordem.servicos.some(s => s.tipo === 'montagem');
    const temDinamometro = ordem.servicos.some(s => s.tipo === 'dinamometro');
    return {
      montagem: temMontagem,
      dinamometro: temDinamometro
    };
  }, [ordem.servicos]);

  // Use memoization for expensive operations
  const servicosAtivos = useMemo(() => {
    return ordem.servicos.filter(servico =>
      servico.subatividades && servico.subatividades.some(sub => sub.selecionada)
    );
  }, [ordem.servicos]);

  useEffect(() => {
    if (!ordem || !funcionario) {
      setEtapasAtivas([]);
      setSelectedEtapa(null);
      setSelectedServicoTipo(null);
      return;
    }

    const etapasDisponiveis = verificarEtapasDisponiveis();
    // Incluir TODAS as etapas na sequência correta
    const allEtapas: EtapaOS[] = [
      'lavagem',
      'inspecao_inicial',
      'retifica'
    ];
    
    if (etapasDisponiveis.montagem) allEtapas.push('montagem');
    if (etapasDisponiveis.dinamometro) allEtapas.push('dinamometro');
    
    // Adicionar inspeção final ao final da lista
    allEtapas.push('inspecao_final');

    setEtapasAtivas(allEtapas);
    if (!selectedEtapa && allEtapas.length > 0) {
      setSelectedEtapa(allEtapas[0]);
    }
    setSelectedServicoTipo(null);
    
    // Calculate progress efficiently
    calcularProgressoTotal(ordem);
  }, [ordem.id, funcionario, calcularProgressoTotal, verificarEtapasDisponiveis]);

  // Optimize event handlers with useCallback
  const handleServicoStatusChange = useCallback(async (
    servicoTipo: TipoServico, 
    concluido: boolean, 
    funcionarioId?: string, 
    funcionarioNome?: string
  ) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    if (funcionario.nivelPermissao !== 'admin' && 
        funcionario.nivelPermissao !== 'gerente' && 
        !funcionario.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
    try {
      // Important: Only update the status of the specific service, not others
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          let subatividades = servico.subatividades;
          if (concluido && subatividades) {
            subatividades = subatividades.map(sub => {
              if (sub.selecionada) {
                return { ...sub, concluida: true };
              }
              return sub;
            });
          }
          
          return { 
            ...servico, 
            concluido,
            subatividades,
            funcionarioId: concluido ? (funcionarioId || funcionario.id) : undefined,
            funcionarioNome: concluido ? (funcionarioNome || funcionario.nome) : undefined,
            dataConclusao: concluido ? new Date() : undefined
          };
        }
        // Important: Return other services unchanged
        return servico;
      });
      
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      if (shouldShowNotification(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`)) {
        toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  }, [ordem, funcionario, onOrdemUpdate]);

  const handleSubatividadeToggle = useCallback(async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    if (funcionario?.nivelPermissao !== 'admin' && 
        funcionario?.nivelPermissao !== 'gerente' && 
        !funcionario?.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
    try {
      console.log("Toggling subatividade in EtapasTracker:", { servicoTipo, subatividadeId, checked });
      
      // Create a deep clone of the services to avoid messing with React's state directly
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              console.log("Atualizando subatividade:", { id: sub.id, concluida: checked });
              return { ...sub, concluida: checked };
            }
            return sub;
          });
          
          return { 
            ...servico, 
            subatividades
          };
        }
        return servico;
      });
      
      // Corrigir o caminho do documento para "ordens_servico" ao invés de "ordens"
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Update local state
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Notify parent component
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Provide feedback to the user
      if (shouldShowNotification(`Subatividade ${checked ? 'concluída' : 'reaberta'}`)) {
        toast.success(`Subatividade ${checked ? 'concluída' : 'reaberta'}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  }, [ordem, funcionario, onOrdemUpdate]);

  const handleEtapaStatusChange = useCallback(async (
    etapa: EtapaOS, 
    concluida: boolean, 
    funcionarioId?: string, 
    funcionarioNome?: string,
    servicoTipo?: TipoServico
  ) => {
    if (!ordem?.id) {
      console.error("Ordem não encontrada");
      return;
    }

    try {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const etapaKey = (["inspecao_inicial", "inspecao_final", "lavagem"].includes(etapa) && servicoTipo)
        ? `${etapa}_${servicoTipo}`
        : etapa;

      // Obter dados atuais da etapa
      const etapaAtual = ordem.etapasAndamento?.[etapaKey] || {};

      // Se estiver atribuindo um funcionário, usar o serviço marcarFuncionarioEmServico
      if (funcionarioId && !concluida) {
        const success = await marcarFuncionarioEmServico(
          funcionarioId,
          ordem.id,
          etapa,
          servicoTipo
        );

        if (!success) {
          toast.error("Erro ao atribuir funcionário");
          return;
        }
      }

      // Preparar objeto para atualização, mantendo dados existentes
      const atualizacao: Record<string, any> = {
        [`etapasAndamento.${etapaKey}`]: {
          ...etapaAtual, // Manter todos os dados existentes
          concluido: Boolean(concluida),
          funcionarioId: funcionarioId || null,
          funcionarioNome: funcionarioNome || "",
          finalizado: concluida ? new Date() : etapaAtual.finalizado,
          iniciado: etapaAtual.iniciado || new Date(),
          servicoTipo: servicoTipo || etapaAtual.servicoTipo,
          status: etapaAtual.status || "em_andamento"
        }
      };

      // Log para depuração
      console.log("Dados a serem salvos:", atualizacao);

      // Atualizar no Firebase
      await updateDoc(ordemRef, atualizacao);

      // Atualizar estado local
      const etapasAndamentoAtualizado = { ...ordem.etapasAndamento || {} };
      etapasAndamentoAtualizado[etapaKey] = atualizacao[`etapasAndamento.${etapaKey}`];

      const ordemAtualizada = {
        ...ordem,
        etapasAndamento: etapasAndamentoAtualizado
      };

      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }

      const servicoMsg = servicoTipo ? ` - ${formatServicoTipo(servicoTipo)}` : '';
      let acao;

      if (concluida) {
        acao = 'concluída';
      } else if (etapaAtual.funcionarioId !== funcionarioId) {
        acao = 'atribuída';
      } else {
        acao = 'atualizada';
      }

      if (shouldShowNotification(`Etapa ${etapaNomesBR[etapa] || etapa}${servicoMsg} ${acao}`)) {
        toast.success(`Etapa ${etapaNomesBR[etapa] || etapa}${servicoMsg} ${acao}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
      toast.error("Erro ao atualizar etapa");
    }
  }, [ordem, onOrdemUpdate]);

  if (servicosAtivos.length === 0) {
    return <EmptyServices />;
  }

  // Memoize etapasDisponiveis for better performance
  const etapasDisponiveis = verificarEtapasDisponiveis();
  
  const isRetificaHabilitada = () => ordem.status === 'fabricacao';
  const isInspecaoFinalHabilitada = () => {
    const { etapasAndamento } = ordem;
    
    const retificaConcluida = etapasAndamento?.['retifica']?.concluido === true;
    const montagemConcluida = etapasAndamento?.['montagem']?.concluido === true;
    const dinamometroConcluida = etapasAndamento?.['dinamometro']?.concluido === true;
    
    return retificaConcluida || montagemConcluida || dinamometroConcluida;
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tracker de Serviços</CardTitle>
          <CardDescription>
            Acompanhe o progresso dos serviços e etapas desta ordem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Total</span>
              <span className="text-sm font-medium">{progressoTotal}%</span>
            </div>
            <Progress value={progressoTotal} className="h-3" />
          </div>
          
          <EtapasSelector 
            etapasAtivas={etapasAtivas} 
            selectedEtapa={selectedEtapa}
            etapasDisponiveis={etapasDisponiveis}
            onEtapaSelect={(etapa) => {
              setSelectedEtapa(etapa);
              setSelectedServicoTipo(null);
            }}
            isRetificaHabilitada={isRetificaHabilitada}
            isInspecaoFinalHabilitada={isInspecaoFinalHabilitada}
          />
          
          {selectedEtapa && (
            <EtapaContent
              ordem={ordem}
              selectedEtapa={selectedEtapa}
              selectedServicoTipo={selectedServicoTipo}
              funcionario={funcionario}
              onSubatividadeToggle={handleSubatividadeToggle}
              onServicoStatusChange={handleServicoStatusChange}
              onEtapaStatusChange={handleEtapaStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
});

EtapasTracker.displayName = "EtapasTracker";

// Helper functions
export const etapaNomesBR: Record<EtapaOS, string> = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

export const formatServicoTipo = (tipo: TipoServico): string => {
  const labels: Record<TipoServico, string> = {
    bloco: "Bloco",
    biela: "Biela",
    cabecote: "Cabeçote",
    virabrequim: "Virabrequim",
    eixo_comando: "Eixo de Comando",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    inspecao_final: "Inspeção Final"
  };
  return labels[tipo] || tipo;
};

export default EtapasTracker;
