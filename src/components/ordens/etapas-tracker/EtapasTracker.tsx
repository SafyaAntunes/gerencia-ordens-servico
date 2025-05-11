import React, { useState, useEffect, useCallback, useMemo } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, EtapaOS, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyServices } from "./EmptyServices";
import { useEtapasProgress } from "./useEtapasProgress";
import EtapasSelector from "./EtapasSelector";
import EtapaContent from "./EtapaContent";

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
  const { progressoTotal, calcularProgressoTotal } = useEtapasProgress({ ordem, onOrdemUpdate });

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

  // Add the missing function for handling subatividade selecionada toggle
  const handleSubatividadeSelecionadaToggle = useCallback(async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    try {
      console.log("Toggling subatividade selecionada:", { servicoTipo, subatividadeId, checked });
      
      // Update the services with the new selection status
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, selecionada: checked };
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
      
      // Provide user feedback
      if (shouldShowNotification(`Subatividade ${checked ? 'selecionada' : 'removida'}`)) {
        toast.success(`Subatividade ${checked ? 'selecionada' : 'removida'} com sucesso`);
      }
    } catch (error) {
      console.error("Erro ao atualizar seleção da subatividade:", error);
      toast.error("Erro ao atualizar seleção da subatividade");
    }
  }, [ordem, onOrdemUpdate]);

  const handleEtapaStatusChange = useCallback(async (
    etapa: EtapaOS, 
    concluida: boolean, 
    funcionarioId?: string, 
    funcionarioNome?: string,
    servicoTipo?: TipoServico
  ) => {
    if (!ordem?.id) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    if (!funcionarioId) {
      toast.error("É necessário selecionar um responsável");
      return;
    }
    
    try {
      // Determinar a chave da etapa com base no tipo de serviço
      const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo) 
        ? `${etapa}_${servicoTipo}` 
        : etapa;
      
      console.log(`Atualizando status da etapa ${etapaKey} para funcionário ${funcionarioNome} (${funcionarioId}), concluída: ${concluida}`);
      
      // Obter documento atual para garantir dados atualizados
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem de serviço não encontrada");
        return;
      }
      
      const dadosAtuais = ordemDoc.data();
      const etapasAndamento = dadosAtuais.etapasAndamento || {};
      const etapaAtual = etapasAndamento[etapaKey] || {};
      
      // Verificar se já está com os mesmos valores para evitar atualização desnecessária
      if (etapaAtual.concluido === concluida && 
          etapaAtual.funcionarioId === funcionarioId &&
          etapaAtual.funcionarioNome === funcionarioNome) {
        console.log("Etapa já está com os mesmos valores, ignorando atualização");
        return;
      }
      
      // Manter funcionários existentes e adicionar o novo se necessário
      const funcionariosAtuais = Array.isArray(etapaAtual.funcionarios) ? etapaAtual.funcionarios : [];
      const funcionarioJaExiste = funcionariosAtuais.some((f: any) => f.id === funcionarioId);
      
      // Preparar objeto para atualização, garantindo que nenhum campo seja undefined
      const atualizacao: Record<string, any> = {
        [`etapasAndamento.${etapaKey}`]: {
          concluido: Boolean(concluida),
          funcionarioId: funcionarioId || null,
          funcionarioNome: funcionarioNome || "",
          finalizado: concluida ? new Date() : null,
          iniciado: etapaAtual.iniciado || new Date(),
          servicoTipo: servicoTipo || null,
          funcionarios: funcionarioJaExiste ? funcionariosAtuais : [
            ...funcionariosAtuais,
            {
              id: funcionarioId,
              nome: funcionarioNome,
              inicio: new Date()
            }
          ]
        }
      };
      
      // Log para depuração
      console.log("Dados a serem salvos:", atualizacao);
      
      // Atualizar no Firebase
      await updateDoc(ordemRef, atualizacao);
      
      // IMPORTANTE: Atualizar o estado local com os novos dados
      const etapasAndamentoAtualizado = { ...ordem.etapasAndamento || {} };
      etapasAndamentoAtualizado[etapaKey] = atualizacao[`etapasAndamento.${etapaKey}`];
      
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento: etapasAndamentoAtualizado
      };
      
      // Atualizar estado local diretamente para refletir mudanças imediatamente
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
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
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
              ordemId={ordem.id}
              etapa={selectedEtapa}
              etapaInfo={ordem.etapasAndamento}
              servicos={
                ordem.servicos.filter(s => {
                  return true; // ou ajuste conforme sua lógica
                })
              }
              servicoTipo={selectedServicoTipo || undefined}
              onSubatividadeToggle={handleSubatividadeToggle}
              onServicoStatusChange={handleServicoStatusChange}
              onEtapaStatusChange={handleEtapaStatusChange}
              onSubatividadeSelecionadaToggle={handleSubatividadeSelecionadaToggle}
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
