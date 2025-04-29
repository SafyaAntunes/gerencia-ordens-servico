
import { useState, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";

export function useEtapasProgress() {
  const [progressoTotal, setProgressoTotal] = useState(0);
  
  const calcularProgressoTotal = useCallback((ordemAtual: OrdemServico) => {
    const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    const etapasRelevantes = etapasPossiveis.filter(etapa => {
      if (etapa === "retifica") {
        return ordemAtual.servicos?.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
      } else if (etapa === "montagem") {
        return ordemAtual.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordemAtual.servicos?.some(s => s.tipo === "dinamometro");
      } else if (etapa === "lavagem") {
        return ordemAtual.servicos?.some(s => s.tipo === "lavagem");
      }
      return true;
    });
    
    const totalEtapas = etapasRelevantes.length;
    const etapasConcluidas = etapasRelevantes.filter(etapa => 
      ordemAtual.etapasAndamento?.[etapa]?.concluido
    ).length;
    
    const servicosAtivos = ordemAtual.servicos?.filter(s => {
      return s.subatividades?.some(sub => sub.selecionada) || true;
    }) || [];
    
    const totalServicos = servicosAtivos.length;
    const servicosConcluidos = servicosAtivos.filter(s => s.concluido).length;
    
    const totalItens = (totalEtapas * 2) + (totalServicos * 1);
    const itensConcluidos = (etapasConcluidas * 2) + (servicosConcluidos * 1);
    
    const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
    setProgressoTotal(progresso);
    
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
