
import { useState, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";

export function useEtapasProgress() {
  const [progressoTotal, setProgressoTotal] = useState(0);
  
  const calcularProgressoTotal = useCallback((ordemAtual: OrdemServico) => {
    // Incluir todas as etapas possíveis, incluindo lavagem, inspeção inicial e inspeção final
    const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    // Filtrar etapas relevantes para esta ordem
    const etapasRelevantes = etapasPossiveis.filter(etapa => {
      if (etapa === "retifica") {
        return ordemAtual.servicos?.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
      } else if (etapa === "montagem") {
        return ordemAtual.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordemAtual.servicos?.some(s => s.tipo === "dinamometro");
      } else if (etapa === "lavagem") {
        // Sempre incluir lavagem
        return true;
      } else if (etapa === "inspecao_inicial" || etapa === "inspecao_final") {
        // Sempre incluir inspeções
        return true;
      }
      return true;
    });
    
    // Contar etapas concluídas
    const etapasConcluidas = etapasRelevantes.filter(etapa => {
      // Para inspeção inicial e final, precisamos verificar todas as inspeções de serviços
      if (etapa === "inspecao_inicial" || etapa === "inspecao_final") {
        const servicosTipos = ordemAtual.servicos
          .filter(s => ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))
          .map(s => s.tipo);
          
        // Verificar se todas as inspeções para este tipo estão concluídas
        return servicosTipos.every(tipo => {
          const chaveEtapa = `${etapa}_${tipo}` as any;
          return ordemAtual.etapasAndamento[chaveEtapa]?.concluido === true;
        });
      }
      
      // Para outras etapas, verificar diretamente
      return ordemAtual.etapasAndamento[etapa]?.concluido === true;
    }).length;
    
    // Contar serviços concluídos
    const servicosAtivos = ordemAtual.servicos?.filter(s => {
      return s.subatividades?.some(sub => sub.selecionada) || true;
    }) || [];
    const totalServicos = servicosAtivos.length;
    const servicosConcluidos = servicosAtivos.filter(s => s.concluido).length;
    
    // Calcular progresso total
    const totalItens = (etapasRelevantes.length * 2) + (totalServicos * 1);
    const itensConcluidos = (etapasConcluidas * 2) + (servicosConcluidos * 1);
    
    const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
    setProgressoTotal(progresso);
    
    // Atualizar progresso no banco de dados
    if (ordemAtual.id && totalItens > 0) {
      const progressoFracao = itensConcluidos / totalItens;
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
  
  return {
    progressoTotal,
    calcularProgressoTotal,
    atualizarProgressoNoDB
  };
}
