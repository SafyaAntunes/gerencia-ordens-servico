
import React, { useState, useEffect } from "react";
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

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  // Removemos lavagem, inspeção inicial e final da lista de etapas
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaOS | null>(null);
  const [selectedServicoTipo, setSelectedServicoTipo] = useState<TipoServico | null>(null);
  const { funcionario } = useAuth();
  const { progressoTotal, calcularProgressoTotal, atualizarProgressoNoDB } = useEtapasProgress();

  const verificarEtapasDisponiveis = () => {
    const temMontagem = ordem.servicos.some(s => s.tipo === 'montagem');
    const temDinamometro = ordem.servicos.some(s => s.tipo === 'dinamometro');
    return {
      montagem: temMontagem,
      dinamometro: temDinamometro
    };
  };

  useEffect(() => {
    if (!ordem || !funcionario) {
      setEtapasAtivas([]);
      setSelectedEtapa(null);
      setSelectedServicoTipo(null);
      return;
    }

    const etapasDisponiveis = verificarEtapasDisponiveis();
    // Removemos lavagem, inspeção inicial e final da lista de etapas
    const allEtapas: EtapaOS[] = [
      'retifica'
    ];
    if (etapasDisponiveis.montagem) allEtapas.push('montagem');
    if (etapasDisponiveis.dinamometro) allEtapas.push('dinamometro');

    setEtapasAtivas(allEtapas);
    if (!selectedEtapa && allEtapas.length > 0) {
      setSelectedEtapa(allEtapas[0]);
    }
    setSelectedServicoTipo(null);
    calcularProgressoTotal(ordem);
  }, [ordem, funcionario, calcularProgressoTotal]);

  const handleServicoStatusChange = async (
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
        return servico;
      });
      
      // Corrigir o caminho do documento para "ordens_servico" ao invés de "ordens"
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    if (funcionario?.nivelPermissao !== 'admin' && 
        funcionario?.nivelPermissao !== 'gerente' && 
        !funcionario?.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
    try {
      console.log("Toggling subatividade in EtapasTracker:", subatividadeId, "to", checked);
      
      // Create a deep clone of the services to avoid messing with React's state directly
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
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
      toast.success(`Subatividade ${checked ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };

  const handleEtapaStatusChange = async (
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
      const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) 
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
      
      // Preparar objeto para atualização
      const atualizacao = {
        [`etapasAndamento.${etapaKey}`]: {
          ...etapaAtual,  // Preserva todos os dados anteriores
          concluido: concluida,
          funcionarioId: funcionarioId,
          funcionarioNome: funcionarioNome || "",
          finalizado: concluida ? new Date() : null, // Definir como null quando reaberto
          iniciado: etapaAtual.iniciado || new Date(),  // Mantém data inicio ou atualiza se for nova atribuição
          // Se for etapa de inspeção, preserva o tipo de serviço
          ...(servicoTipo ? { servicoTipo } : {})
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
      
      toast.success(`Etapa ${etapaNomesBR[etapa] || etapa}${servicoMsg} ${acao}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  const etapasDisponiveis = verificarEtapasDisponiveis();
  const servicosAtivos = ordem.servicos.filter(servico =>
    servico.subatividades && servico.subatividades.some(sub => sub.selecionada)
  );
  
  if (servicosAtivos.length === 0) {
    return <EmptyServices />;
  }

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
            etapasDisponiveis={verificarEtapasDisponiveis()}
            onEtapaSelect={(etapa) => {
              setSelectedEtapa(etapa);
              setSelectedServicoTipo(null);
            }}
            isRetificaHabilitada={() => ordem.status === 'fabricacao'}
            isInspecaoFinalHabilitada={() => {
              const { etapasAndamento } = ordem;
              
              // Modificar a lógica já que inspeção final agora é serviço
              const retificaConcluida = etapasAndamento?.['retifica']?.concluido === true;
              const montagemConcluida = etapasAndamento?.['montagem']?.concluido === true;
              const dinamometroConcluida = etapasAndamento?.['dinamometro']?.concluido === true;
              
              console.log("Estado de conclusão das etapas:", {
                retifica: retificaConcluida,
                montagem: montagemConcluida,
                dinamometro: dinamometroConcluida
              });
              
              return retificaConcluida || montagemConcluida || dinamometroConcluida;
            }}
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
};

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
