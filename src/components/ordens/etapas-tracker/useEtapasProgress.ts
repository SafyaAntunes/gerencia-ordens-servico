import { useState, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";
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
    
    const todosServicosRetificaConcluidos = 
      servicosRetifica.length > 0 && 
      servicosRetifica.every(s => s.concluido) &&
      ordemAtual.status === 'fabricacao';
    
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
  
  return {
    progressoTotal,
    calcularProgressoTotal,
    atualizarProgressoNoDB,
    etapaInfos: ordem.etapasAndamento || {},
    servicosByEtapa: ordem.servicos.reduce((acc, servico) => {
      // Determine the etapa based on the service type
      let etapa: EtapaOS;
      if (servico.tipo === 'lavagem') {
        etapa = 'lavagem';
      } else if (servico.tipo === 'inspecao_inicial') {
        etapa = 'inspecao_inicial';
      } else if (servico.tipo === 'inspecao_final') {
        etapa = 'inspecao_final';
      } else if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)) {
        etapa = 'retifica';
      } else if (servico.tipo === 'montagem') {
        etapa = 'montagem';
      } else if (servico.tipo === 'dinamometro') {
        etapa = 'dinamometro';
      } else {
        return acc;
      }

      if (!acc[etapa]) {
        acc[etapa] = [];
      }
      acc[etapa].push(servico);
      return acc;
    }, {} as Record<EtapaOS, typeof ordem.servicos>),
    handleSubatividadeToggle: async (servicoTipo: string, subatividadeId: string, checked: boolean) => {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        [`servicos.${ordem.servicos.findIndex(s => s.tipo === servicoTipo)}.subatividades.${ordem.servicos.find(s => s.tipo === servicoTipo)?.subatividades.findIndex(sub => sub.id === subatividadeId)}.selecionada`]: checked
      });
    },
    handleServicoStatusChange: async (servicoTipo: string, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        [`servicos.${ordem.servicos.findIndex(s => s.tipo === servicoTipo)}.concluido`]: concluido,
        [`servicos.${ordem.servicos.findIndex(s => s.tipo === servicoTipo)}.funcionarioId`]: funcionarioId,
        [`servicos.${ordem.servicos.findIndex(s => s.tipo === servicoTipo)}.funcionarioNome`]: funcionarioNome
      });
    },
    handleEtapaStatusChange: async (etapa: string, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: string) => {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
      await updateDoc(ordemRef, {
        [`etapasAndamento.${etapaKey}.concluido`]: concluida,
        [`etapasAndamento.${etapaKey}.funcionarioId`]: funcionarioId,
        [`etapasAndamento.${etapaKey}.funcionarioNome`]: funcionarioNome,
        [`etapasAndamento.${etapaKey}.finalizado`]: concluida ? new Date() : null
      });
    },
    handleSubatividadeSelecionadaToggle: async (servicoTipo: string, subatividadeId: string, checked: boolean) => {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        [`servicos.${ordem.servicos.findIndex(s => s.tipo === servicoTipo)}.subatividades.${ordem.servicos.find(s => s.tipo === servicoTipo)?.subatividades.findIndex(sub => sub.id === subatividadeId)}.selecionada`]: checked
      });
    }
  };
}
