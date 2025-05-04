
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
  
  return {
    progressoTotal,
    calcularProgressoTotal,
    atualizarProgressoNoDB
  };
}
