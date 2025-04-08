
import { EtapaOS, OrdemServico, TipoServico } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useState } from "react";
import { Progress } from "../ui/progress";
import EtapaCard from "./EtapaCard";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordem: OrdemServico) => void;
}

export default function EtapasTracker({ ordem, onOrdemUpdate }: EtapasTrackerProps) {
  const [etapas, setEtapas] = useState<EtapaOS[]>([]);
  const [progresso, setProgresso] = useState(0);
  const { funcionario } = useAuth();

  useEffect(() => {
    let novasEtapas: EtapaOS[] = ["lavagem", "inspecao_inicial"];
    
    if (ordem.servicos?.some(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
      novasEtapas.push("retifica");
    }
    
    const temMontagem = ordem.servicos?.some(s => s.tipo === "montagem");
    if (temMontagem) {
      novasEtapas.push("montagem");
    }
    
    const temDinamometro = ordem.servicos?.some(s => s.tipo === "dinamometro");
    if (temDinamometro) {
      novasEtapas.push("dinamometro");
    }
    
    novasEtapas.push("inspecao_final");
    
    setEtapas(novasEtapas);
    
    // Calcular o progresso baseado em todas as etapas
    calcularProgressoTotal(ordem, novasEtapas);
    
    // Verificar se todas as atividades de cada etapa foram concluídas
    // Se sim, marcar a etapa como concluída automaticamente
    verificarEtapasConcluidas(ordem, novasEtapas);
    
  }, [ordem.servicos, ordem.etapasAndamento]);

  const etapasLabels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };
  
  const verificarEtapasConcluidas = async (ordem: OrdemServico, etapasList: EtapaOS[]) => {
    const etapasParaAtualizar: EtapaOS[] = [];
    
    // Verificar etapa de retífica
    const servicosRetifica = ordem.servicos.filter(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo)
    );
    
    if (servicosRetifica.length > 0 && !ordem.etapasAndamento?.retifica?.concluido) {
      const todosServicosRetificaConcluidos = servicosRetifica.every(s => s.concluido);
      if (todosServicosRetificaConcluidos) {
        etapasParaAtualizar.push("retifica");
      }
    }
    
    // Verificar etapa de montagem
    const servicosMontagem = ordem.servicos.filter(s => s.tipo === "montagem");
    if (servicosMontagem.length > 0 && !ordem.etapasAndamento?.montagem?.concluido) {
      const todosServicoMontagemConcluidos = servicosMontagem.every(s => s.concluido);
      if (todosServicoMontagemConcluidos) {
        etapasParaAtualizar.push("montagem");
      }
    }
    
    // Verificar etapa de dinamômetro
    const servicosDinamometro = ordem.servicos.filter(s => s.tipo === "dinamometro");
    if (servicosDinamometro.length > 0 && !ordem.etapasAndamento?.dinamometro?.concluido) {
      const todosServicoDinamometroConcluidos = servicosDinamometro.every(s => s.concluido);
      if (todosServicoDinamometroConcluidos) {
        etapasParaAtualizar.push("dinamometro");
      }
    }
    
    // Atualizar etapas se necessário
    if (etapasParaAtualizar.length > 0 && ordem.id) {
      const etapasAndamento = { ...ordem.etapasAndamento };
      
      for (const etapa of etapasParaAtualizar) {
        etapasAndamento[etapa] = {
          ...(etapasAndamento[etapa] || {}),
          concluido: true,
          finalizado: new Date()
        };
        
        // Notificar usuário
        toast.success(`Etapa ${etapasLabels[etapa]} concluída automaticamente`);
      }
      
      try {
        const orderRef = doc(db, "ordens", ordem.id);
        await updateDoc(orderRef, { etapasAndamento });
        
        const ordemAtualizada = {
          ...ordem,
          etapasAndamento
        };
        
        // Recalcular o progresso total
        const novoProgresso = calcularProgressoTotal(ordemAtualizada, etapasList);
        const novoProgressoDecimal = novoProgresso / 100;
        
        await updateDoc(orderRef, { progressoEtapas: novoProgressoDecimal });
        ordemAtualizada.progressoEtapas = novoProgressoDecimal;
        
        onOrdemUpdate(ordemAtualizada);
      } catch (error) {
        console.error("Erro ao atualizar etapas concluídas automaticamente:", error);
      }
    }
  };
  
  // Calcula o progresso total baseado em todas as atividades de todas as etapas
  // e das etapas em si
  const calcularProgressoTotal = (ordem: OrdemServico, etapasList: EtapaOS[]) => {
    // Contar o total de itens a serem considerados no progresso
    const totalEtapas = etapasList.length;
    const totalServicos = ordem.servicos.length;
    const totalItens = totalEtapas + totalServicos;
    
    if (totalItens === 0) {
      setProgresso(0);
      return 0;
    }
    
    // Contar etapas concluídas
    const etapasConcluidas = etapasList.filter(etapa => 
      ordem.etapasAndamento?.[etapa]?.concluido
    ).length;
    
    // Contar serviços concluídos
    const servicosConcluidos = ordem.servicos.filter(servico => servico.concluido).length;
    
    // Calcular percentual
    const itensConcluidos = etapasConcluidas + servicosConcluidos;
    const percentualProgresso = Math.round((itensConcluidos / totalItens) * 100);
    setProgresso(percentualProgresso);
    
    return percentualProgresso;
  };

  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem.id) return;
    
    try {
      const servicos = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, concluida: checked };
            }
            return sub;
          });
          
          // Importante: Não marcar o serviço como concluído automaticamente
          // mesmo que todas as subatividades estejam concluídas
          return { 
            ...servico, 
            subatividades
          };
        }
        return servico;
      });
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { servicos });
      
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      // Recalcular o progresso total
      const novoProgresso = calcularProgressoTotal(ordemAtualizada, etapas);
      const novoProgressoDecimal = novoProgresso / 100;
      
      await updateDoc(orderRef, { progressoEtapas: novoProgressoDecimal });
      ordemAtualizada.progressoEtapas = novoProgressoDecimal;
      
      onOrdemUpdate(ordemAtualizada);
      
      // Notificar se a subatividade foi concluída
      if (checked) {
        // Encontrar o nome da subatividade para exibir na notificação
        const servicoAtualizado = servicos.find(s => s.tipo === servicoTipo);
        const subatividadeAtualizada = servicoAtualizado?.subatividades?.find(s => s.id === subatividadeId);
        
        if (subatividadeAtualizada) {
          toast.success(`Subatividade "${subatividadeAtualizada.nome}" concluída`);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };
  
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem.id) return;
    
    try {
      const servicos = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          // Se marcar como concluído, todas as subatividades também são marcadas
          const subatividades = servico.subatividades?.map(sub => ({
            ...sub,
            concluida: concluido ? true : sub.concluida
          }));
          
          return { 
            ...servico, 
            concluido,
            subatividades: subatividades || servico.subatividades
          };
        }
        return servico;
      });
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { servicos });
      
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      // Recalcular o progresso total
      const novoProgresso = calcularProgressoTotal(ordemAtualizada, etapas);
      const novoProgressoDecimal = novoProgresso / 100;
      
      await updateDoc(orderRef, { progressoEtapas: novoProgressoDecimal });
      ordemAtualizada.progressoEtapas = novoProgressoDecimal;
      
      onOrdemUpdate(ordemAtualizada);
      
      if (concluido) {
        const servicoNome = (() => {
          switch(servicoTipo) {
            case 'bloco': return 'Bloco';
            case 'biela': return 'Biela';
            case 'cabecote': return 'Cabeçote';
            case 'virabrequim': return 'Virabrequim';
            case 'eixo_comando': return 'Eixo de Comando';
            case 'montagem': return 'Montagem';
            case 'dinamometro': return 'Dinamômetro';
            default: return servicoTipo;
          }
        })();
        
        toast.success(`Serviço ${servicoNome} concluído`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  const handleEtapaStatusChange = async (etapa: EtapaOS, concluida: boolean) => {
    if (!ordem.id) return;
    
    try {
      // Atualizar a etapa específica
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...(ordem.etapasAndamento?.[etapa] || {}),
          concluido: concluida,
          iniciado: ordem.etapasAndamento?.[etapa]?.iniciado || new Date(), // Se não tiver data de início, adiciona agora
          finalizado: concluida ? new Date() : undefined
        }
      };
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { etapasAndamento });
      
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      // Recalcular o progresso total
      const novoProgresso = calcularProgressoTotal(ordemAtualizada, etapas);
      const novoProgressoDecimal = novoProgresso / 100;
      
      await updateDoc(orderRef, { progressoEtapas: novoProgressoDecimal });
      ordemAtualizada.progressoEtapas = novoProgressoDecimal;
      
      onOrdemUpdate(ordemAtualizada);
      
      if (concluida) {
        toast.success(`Etapa ${etapasLabels[etapa]} concluída`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  if (etapas.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Carregando etapas...</div>;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Acompanhamento das Etapas</CardTitle>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {etapas.map((etapa) => {
            return (
              <EtapaCard
                key={etapa}
                ordemId={ordem.id}
                etapa={etapa}
                etapaNome={etapasLabels[etapa]}
                funcionarioId={funcionario?.id || ""}
                funcionarioNome={funcionario?.nome}
                servicos={ordem.servicos}
                etapaInfo={ordem.etapasAndamento?.[etapa]}
                onSubatividadeToggle={(servicoTipo, subId, checked) => 
                  handleSubatividadeToggle(servicoTipo, subId, checked)
                }
                onServicoStatusChange={(servicoTipo, concluido) => 
                  handleServicoStatusChange(servicoTipo, concluido)
                }
                onEtapaStatusChange={(etapa, concluida) =>
                  handleEtapaStatusChange(etapa, concluida)
                }
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
