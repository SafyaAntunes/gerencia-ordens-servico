
import { useState, useEffect } from "react";
import { EtapaOS, OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import EtapaCard from "./EtapaCard";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export default function EtapasTracker({ ordem, onOrdemUpdate }: EtapasTrackerProps) {
  const [progresso, setProgresso] = useState(0);
  const { funcionario } = useAuth();
  
  // Lista de etapas disponíveis
  const etapas: EtapaOS[] = [
    "lavagem",
    "inspecao_inicial",
    "retifica",
    "montagem",
    "dinamometro",
    "inspecao_final"
  ];
  
  // Filtra as etapas disponíveis com base nos serviços selecionados
  const etapasAtivas = (() => {
    const etapasList: EtapaOS[] = ["lavagem", "inspecao_inicial"];
    
    // Adicionar retífica se tiver algum serviço de retífica
    if (ordem.servicos?.some(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo)
    )) {
      etapasList.push("retifica");
    }
    
    // Adicionar montagem se tiver serviço de montagem
    if (ordem.servicos?.some(s => s.tipo === "montagem")) {
      etapasList.push("montagem");
    }
    
    // Adicionar dinamômetro se tiver serviço de dinamômetro
    if (ordem.servicos?.some(s => s.tipo === "dinamometro")) {
      etapasList.push("dinamometro");
    }
    
    // Sempre adicionar inspeção final
    etapasList.push("inspecao_final");
    
    return etapasList;
  })();
  
  // Labels para as etapas
  const etapasLabels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };
  
  // Calcular progresso quando a ordem for carregada ou atualizada
  useEffect(() => {
    if (ordem) {
      calcularProgressoTotal(ordem, etapasAtivas);
    }
  }, [ordem, etapasAtivas]);
  
  // Função para lidar com a troca de status da subatividade
  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Crie uma cópia dos serviços atuais
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          // Atualiza a subatividade específica
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, concluida: checked };
            }
            return sub;
          });
          
          // Verifica se todas as subatividades estão concluídas
          const todasConcluidas = subatividades
            .filter(sub => sub.selecionada)
            .every(sub => sub.concluida);
          
          // Se todas estiverem concluídas, marque o serviço como concluído
          return { 
            ...servico, 
            subatividades,
            concluido: todasConcluidas
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Calcule o novo progresso
      calcularProgressoTotal(ordemAtualizada, etapasAtivas);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      toast.success(`Subatividade ${checked ? 'concluída' : 'desmarcada'}`);
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };
  
  // Função para lidar com a troca de status do serviço
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Crie uma cópia dos serviços atuais
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          // Se estiver marcando como concluído, todas as subatividades também devem ser marcadas
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
            subatividades
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Calcule o novo progresso
      calcularProgressoTotal(ordemAtualizada, etapasAtivas);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
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
  
  // Função para iniciar o timer de uma etapa
  const handleStartEtapa = async (etapa: EtapaOS) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Verifique se a etapa atual já está iniciada
      if (ordem.etapasAndamento?.[etapa]?.iniciado) {
        // Se já estiver iniciada, não faça nada (evita sobrescrever dados existentes)
        return;
      }
      
      // Atualize o estado da etapa no Firestore
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...(ordem.etapasAndamento?.[etapa] || {}),
          iniciado: new Date(),
          concluido: false
        }
      };
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Calcule o novo progresso
      calcularProgressoTotal(ordemAtualizada, etapasAtivas);
      
      toast.success(`Etapa ${etapasLabels[etapa]} iniciada`);
    } catch (error) {
      console.error("Erro ao iniciar etapa:", error);
      toast.error("Erro ao iniciar etapa");
    }
  };
  
  // Função para pausar uma etapa
  const handlePauseEtapa = async (etapa: EtapaOS, motivo?: string) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Obtenha as pausas existentes
      const pausasAtuais = ordem.etapasAndamento?.[etapa]?.pausas || [];
      
      // Adicione uma nova pausa
      const novaPausa = {
        inicio: Date.now(),
        motivo
      };
      
      const pausas = [...pausasAtuais, novaPausa];
      
      // Atualize o estado da etapa no Firestore
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...(ordem.etapasAndamento?.[etapa] || {}),
          pausas
        }
      };
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Etapa ${etapasLabels[etapa]} pausada`);
    } catch (error) {
      console.error("Erro ao pausar etapa:", error);
      toast.error("Erro ao pausar etapa");
    }
  };
  
  // Função para retomar uma etapa
  const handleResumeEtapa = async (etapa: EtapaOS) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Obtenha as pausas existentes
      const pausasAtuais = ordem.etapasAndamento?.[etapa]?.pausas || [];
      
      if (pausasAtuais.length === 0) return;
      
      // Atualize a última pausa
      const ultimaPausa = { ...pausasAtuais[pausasAtuais.length - 1], fim: Date.now() };
      const pausas = [...pausasAtuais.slice(0, -1), ultimaPausa];
      
      // Atualize o estado da etapa no Firestore
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...(ordem.etapasAndamento?.[etapa] || {}),
          pausas
        }
      };
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Etapa ${etapasLabels[etapa]} retomada`);
    } catch (error) {
      console.error("Erro ao retomar etapa:", error);
      toast.error("Erro ao retomar etapa");
    }
  };
  
  // Função para concluir uma etapa
  const handleEtapaStatusChange = async (etapa: EtapaOS, concluida: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Atualize o estado da etapa no Firestore
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...(ordem.etapasAndamento?.[etapa] || {}),
          concluido: concluida,
          iniciado: ordem.etapasAndamento?.[etapa]?.iniciado || new Date(), // Se não tiver data de início, adiciona agora
          finalizado: concluida ? new Date() : undefined
        }
      };
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      // Calcule o novo progresso
      calcularProgressoTotal(ordemAtualizada, etapasAtivas);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Etapa ${etapasLabels[etapa]} ${concluida ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Progresso Geral</h2>
        <Progress value={progresso} className="h-3" />
        <p className="text-right mt-1 text-sm text-muted-foreground">{progresso}% concluído</p>
      </div>
      
      <div className="space-y-6">
        {etapasAtivas.map((etapa) => (
          <EtapaCard
            key={etapa}
            ordemId={ordem.id}
            etapa={etapa}
            etapaNome={etapasLabels[etapa]}
            funcionarioId={funcionario?.id || ""}
            funcionarioNome={funcionario?.nome}
            servicos={ordem.servicos}
            etapaInfo={ordem.etapasAndamento?.[etapa]}
            onSubatividadeToggle={handleSubatividadeToggle}
            onServicoStatusChange={handleServicoStatusChange}
            onEtapaStatusChange={handleEtapaStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
