import { useState, useCallback } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";

interface UseEtapasProgressProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function useEtapasProgress({ ordem, onOrdemUpdate }: UseEtapasProgressProps) {
  const [progressoTotal, setProgressoTotal] = useState(0);
  
  const calcularProgressoTotal = useCallback((ordemAtual: OrdemServico) => {
    // Incluir todas as etapas possíveis, incluindo lavagem, inspeção inicial e inspeção final
    const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    // Filtrar etapas relevantes para esta ordem
    const etapasRelevantes = etapasPossiveis.filter(etapa => {
      if (etapa === "montagem") {
        return ordemAtual.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordemAtual.servicos?.some(s => s.tipo === "dinamometro");
      }
      return true;
    });
    
    // Calcular pontos para etapas (cada etapa vale 2 pontos)
    const etapasPontosPossiveis = etapasRelevantes.length * 2;
    let etapasPontosObtidos = 0;
    
    etapasRelevantes.forEach(etapa => {
      // Verificar se é etapa de inspeção inicial ou final
      if (etapa === "inspecao_inicial" || etapa === "inspecao_final") {
        const servicosTipos = ordemAtual.servicos
          .filter(s => ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))
          .map(s => s.tipo);

        if (servicosTipos.length > 0) {
          const etapasConcluidas = servicosTipos.filter(tipo => {
            const chaveEtapa = `${etapa}_${tipo}` as any;
            return ordemAtual.etapasAndamento[chaveEtapa]?.concluido === true;
          }).length;
          
          // Se todas estão concluídas, damos 2 pontos, se algumas, 1 ponto
          if (etapasConcluidas === servicosTipos.length) {
            etapasPontosObtidos += 2;
          } else if (etapasConcluidas > 0) {
            etapasPontosObtidos += 1;
          }
        }
      }
      // Para outras etapas, verificar diretamente
      else if (ordemAtual.etapasAndamento[etapa]?.concluido) {
        etapasPontosObtidos += 2; // Etapa concluída = 2 pontos
      } else if (ordemAtual.etapasAndamento[etapa]?.iniciado) {
        etapasPontosObtidos += 1; // Etapa iniciada mas não concluída = 1 ponto
      }
    });
    
    // Calcular pontos para serviços (cada serviço vale 1 ponto)
    const servicosAtivos = ordemAtual.servicos?.filter(s => {
      return s.subatividades?.some(sub => sub.selecionada);
    }) || [];
    
    const servicosPontosPossiveis = servicosAtivos.length;
    const servicosPontosObtidos = servicosAtivos.filter(s => s.concluido).length;
    
    // Verificar se a etapa de retífica deve ser marcada como concluída
    // Se todos os serviços da retífica estão concluídos
    const servicosRetifica = ordemAtual.servicos?.filter(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo)
    );
    
    const statusStr = ordemAtual.status as string;
    const todosServicosRetificaConcluidos = 
      servicosRetifica.length > 0 && 
      servicosRetifica.every(s => s.concluido) &&
      (statusStr === 'executando_servico' || statusStr === 'fabricacao');
    
    // Se todos os serviços de retífica estão concluídos mas a etapa não está marcada como concluída
    if (todosServicosRetificaConcluidos && 
        ordemAtual.etapasAndamento?.retifica && 
        !ordemAtual.etapasAndamento.retifica.concluido) {
      
      // Atualizar automaticamente o status da etapa no Firebase
      try {
        const ordemRef = doc(db, "ordens_servico", ordemAtual.id);
        
        // Usar o funcionário do último serviço concluído
        const ultimoServicoConcluido = servicosRetifica.find(s => s.concluido && s.funcionarioId);
        const funcionarioId = ultimoServicoConcluido?.funcionarioId || ordemAtual.etapasAndamento.retifica.funcionarioId;
        const funcionarioNome = ultimoServicoConcluido?.funcionarioNome || ordemAtual.etapasAndamento.retifica.funcionarioNome;
        
        if (funcionarioId) {
          // Marcar a etapa como concluída
          updateDoc(ordemRef, {
            [`etapasAndamento.retifica.concluido`]: true,
            [`etapasAndamento.retifica.finalizado`]: new Date(),
            [`etapasAndamento.retifica.funcionarioId`]: funcionarioId,
            [`etapasAndamento.retifica.funcionarioNome`]: funcionarioNome || ""
          }).then(() => {
            toast.success("Etapa de Retífica concluída automaticamente");
            etapasPontosObtidos += 2; // Adicionar pontos da retífica
          }).catch(err => {
            console.error("Erro ao concluir etapa de retífica:", err);
          });
        }
      } catch (error) {
        console.error("Erro ao atualizar status da etapa de retífica:", error);
      }
    }
    
    // Calcular progresso total
    const pontosTotaisPossiveis = etapasPontosPossiveis + servicosPontosPossiveis;
    const pontosTotaisObtidos = etapasPontosObtidos + servicosPontosObtidos;
    
    const progresso = pontosTotaisPossiveis > 0 
      ? Math.round((pontosTotaisObtidos / pontosTotaisPossiveis) * 100) 
      : 0;
    
    setProgressoTotal(progresso);
    
    // Atualizar progresso no banco de dados
    if (ordemAtual.id && pontosTotaisPossiveis > 0) {
      const progressoFracao = pontosTotaisObtidos / pontosTotaisPossiveis;
      atualizarProgressoNoDB(ordemAtual.id, progressoFracao);
    }
  }, []);
  
  const atualizarProgressoNoDB = async (ordenId: string, progresso: number) => {
    try {
      const ordemRef = doc(db, "ordens_servico", ordenId);
      await updateDoc(ordemRef, { progressoEtapas: progresso });
    } catch (error) {
      console.error("Erro ao atualizar progresso da ordem:", error);
    }
  };
  
  // Handlers for subactivities
  const handleSubatividadeToggle = useCallback(async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    try {
      // Find the service and subactivity
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      if (servicoIndex < 0) return;
      
      const servicos = [...ordem.servicos];
      const servico = {...servicos[servicoIndex]};
      
      if (!servico.subatividades) return;
      
      const subAtividadeIndex = servico.subatividades.findIndex(sub => sub.id === subatividadeId);
      if (subAtividadeIndex < 0) return;
      
      // Create a deep clone to avoid mutation
      const subatividades = [...servico.subatividades];
      subatividades[subAtividadeIndex] = {
        ...subatividades[subAtividadeIndex],
        concluida: checked
      };
      
      servico.subatividades = subatividades;
      servicos[servicoIndex] = servico;
      
      // Update in Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos });
      
      // Update local state
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      if (checked) {
        toast.success("Subatividade marcada como concluída");
      } else {
        toast.success("Subatividade desmarcada");
      }
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  }, [ordem, onOrdemUpdate]);

  // Handler for service status
  const handleServicoStatusChange = useCallback(async (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => {
    if (!ordem?.id) return;
    
    try {
      // Find the service
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      if (servicoIndex < 0) return;
      
      const servicos = [...ordem.servicos];
      
      // Update service
      servicos[servicoIndex] = {
        ...servicos[servicoIndex],
        concluido,
        funcionarioId: funcionarioId || "",
        funcionarioNome: funcionarioNome || "",
        dataConclusao: concluido ? new Date() : undefined
      };
      
      // Update in Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos });
      
      // Update local state
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      toast.success(`Serviço ${concluido ? "concluído" : "reaberto"}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  }, [ordem, onOrdemUpdate]);

  // Handler for etapa status
  const handleEtapaStatusChange = useCallback(async (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => {
    if (!ordem?.id) return;
    
    try {
      // Determine etapa key
      const etapaKey = 
        (["inspecao_inicial", "inspecao_final", "lavagem"].includes(etapa) && servicoTipo) 
          ? `${etapa}_${servicoTipo}` 
          : etapa;
      
      // Get current order data
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem não encontrada");
        return;
      }
      
      const dadosAtuais = ordemDoc.data();
      const etapasAndamento = dadosAtuais.etapasAndamento || {};
      const etapaAtual = etapasAndamento[etapaKey] || {};
      
      // Update etapa
      await updateDoc(ordemRef, {
        [`etapasAndamento.${etapaKey}`]: {
          ...etapaAtual,
          concluido: concluida,
          funcionarioId: funcionarioId || "",
          funcionarioNome: funcionarioNome || "",
          iniciado: etapaAtual.iniciado || new Date(),
          finalizado: concluida ? new Date() : null,
          servicoTipo: servicoTipo || null
        }
      });
      
      // Update local state
      const etapasAndamentoAtualizado = { ...ordem.etapasAndamento || {} };
      etapasAndamentoAtualizado[etapaKey] = {
        ...etapasAndamentoAtualizado[etapaKey] || {},
        concluido: concluida,
        funcionarioId: funcionarioId || "",
        funcionarioNome: funcionarioNome || "",
        iniciado: etapaAtual.iniciado || new Date(),
        finalizado: concluida ? new Date() : null,
        servicoTipo: servicoTipo || null
      };
      
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento: etapasAndamentoAtualizado
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      toast.success(`Etapa ${concluida ? "concluída" : "atualizada"}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  }, [ordem, onOrdemUpdate]);

  // Handler for subactivity selection
  const handleSubatividadeSelecionadaToggle = useCallback(async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    try {
      // Find the service and subactivity
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      if (servicoIndex < 0) return;
      
      const servicos = [...ordem.servicos];
      const servico = {...servicos[servicoIndex]};
      
      if (!servico.subatividades) return;
      
      const subAtividadeIndex = servico.subatividades.findIndex(sub => sub.id === subatividadeId);
      if (subAtividadeIndex < 0) return;
      
      // Create a deep clone to avoid mutation
      const subatividades = [...servico.subatividades];
      subatividades[subAtividadeIndex] = {
        ...subatividades[subAtividadeIndex],
        selecionada: checked
      };
      
      servico.subatividades = subatividades;
      servicos[servicoIndex] = servico;
      
      // Update in Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos });
      
      // Update local state
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      toast.success(`Subatividade ${checked ? "selecionada" : "removida"}`);
    } catch (error) {
      console.error("Erro ao atualizar seleção da subatividade:", error);
      toast.error("Erro ao atualizar seleção da subatividade");
    }
  }, [ordem, onOrdemUpdate]);
  
  return {
    progressoTotal,
    calcularProgressoTotal,
    atualizarProgressoNoDB,
    handleSubatividadeToggle,
    handleServicoStatusChange,
    handleEtapaStatusChange,
    handleSubatividadeSelecionadaToggle
  };
}
