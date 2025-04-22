
import { OrdemServico, EtapaOS } from "@/types/ordens";

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'orcamento': return 'Orçamento';
    case 'aguardando_aprovacao': return 'Aguardando Aprovação';
    case 'fabricacao': return 'Em Fabricação';
    case 'aguardando_peca_cliente': return 'Aguardando Peça (Cliente)';
    case 'aguardando_peca_interno': return 'Aguardando Peça (Interno)';
    case 'finalizado': return 'Finalizado';
    case 'entregue': return 'Entregue';
    default: return status;
  }
};

export function calcularPercentualConclusao(ordem: OrdemServico): number {
  if (!ordem) return 0;
  const etapas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
  const etapasConcluidas = etapas.filter(etapa => ordem.etapasAndamento[etapa]?.concluido).length;
  const percentualEtapas = (etapasConcluidas / etapas.length) * 100;
  const totalServicos = ordem.servicos.length;
  const servicosConcluidos = ordem.servicos.filter(servico => servico.concluido).length;
  const percentualServicos = totalServicos > 0 ? (servicosConcluidos / totalServicos) * 100 : 0;
  return Math.round((percentualEtapas * 2 + percentualServicos * 1) / 3);
}

export function calcularTempoTotal(ordem: OrdemServico): number {
  let tempoTotal = 0;
  Object.values(ordem.etapasAndamento).forEach(etapa => {
    if (etapa.iniciado && etapa.finalizado) {
      const inicio = new Date(etapa.iniciado).getTime();
      const fim = new Date(etapa.finalizado).getTime();
      tempoTotal += fim - inicio;
    }
  });
  return tempoTotal;
}

export function calcularTempoEstimado(ordem: OrdemServico): number {
  let tempoEstimado = 0;
  ordem.servicos.forEach(servico => {
    if (servico.subatividades) {
      servico.subatividades
        .filter(sub => sub.selecionada)
        .forEach(sub => {
          if (sub.tempoEstimado) {
            tempoEstimado += sub.tempoEstimado * 60 * 60 * 1000;
          }
        });
    }
  });
  return tempoEstimado;
}

// Função para verificar etapas paradas
export function verificarEtapasParadas(ordem: OrdemServico): { etapa: string; tempoParado: number }[] {
  const etapasParadas: { etapa: string; tempoParado: number }[] = [];
  const agora = new Date().getTime();
  
  Object.entries(ordem.etapasAndamento).forEach(([etapaKey, etapaInfo]) => {
    // Verifica se a etapa está iniciada mas não concluída
    if (etapaInfo.iniciado && !etapaInfo.concluido && !etapaInfo.finalizado) {
      const iniciado = new Date(etapaInfo.iniciado).getTime();
      const tempoParado = agora - iniciado;
      
      // Considera parada se estiver há mais de 24 horas sem conclusão
      if (tempoParado > 24 * 60 * 60 * 1000) {
        const etapaNome = {
          lavagem: "Lavagem",
          inspecao_inicial: "Inspeção Inicial",
          retifica: "Retífica",
          montagem: "Montagem",
          dinamometro: "Dinamômetro",
          inspecao_final: "Inspeção Final"
        }[etapaKey as EtapaOS] || etapaKey;
        
        etapasParadas.push({
          etapa: etapaNome,
          tempoParado
        });
      }
    }
  });
  
  return etapasParadas;
}

// Função para contar pessoas trabalhando
export function contarPessoasTrabalhando(ordem: OrdemServico): number {
  const funcionariosIds = new Set<string>();
  
  Object.values(ordem.etapasAndamento).forEach(etapaInfo => {
    if (etapaInfo.iniciado && !etapaInfo.finalizado && etapaInfo.funcionarioId) {
      funcionariosIds.add(etapaInfo.funcionarioId);
    }
  });
  
  return funcionariosIds.size;
}

// Função para verificar atrasos
export function verificarAtrasos(ordem: OrdemServico): { tipo: 'etapa' | 'ordem'; nome: string; atraso: number }[] {
  const atrasos: { tipo: 'etapa' | 'ordem'; nome: string; atraso: number }[] = [];
  const agora = new Date().getTime();
  
  // Verifica atraso na ordem como um todo
  if (ordem.dataPrevistaEntrega && agora > new Date(ordem.dataPrevistaEntrega).getTime()) {
    atrasos.push({
      tipo: 'ordem',
      nome: 'Entrega',
      atraso: agora - new Date(ordem.dataPrevistaEntrega).getTime()
    });
  }
  
  // Verifica atrasos nas etapas
  Object.entries(ordem.etapasAndamento).forEach(([etapaKey, etapaInfo]) => {
    if (etapaInfo.iniciado && !etapaInfo.concluido && etapaInfo.tempoEstimado) {
      const iniciado = new Date(etapaInfo.iniciado).getTime();
      const tempoDecorrido = agora - iniciado;
      const tempoEstimadoMs = etapaInfo.tempoEstimado * 60 * 60 * 1000;
      
      if (tempoDecorrido > tempoEstimadoMs) {
        const etapaNome = {
          lavagem: "Lavagem",
          inspecao_inicial: "Inspeção Inicial",
          retifica: "Retífica",
          montagem: "Montagem",
          dinamometro: "Dinamômetro",
          inspecao_final: "Inspeção Final"
        }[etapaKey as EtapaOS] || etapaKey;
        
        atrasos.push({
          tipo: 'etapa',
          nome: etapaNome,
          atraso: tempoDecorrido - tempoEstimadoMs
        });
      }
    }
  });
  
  return atrasos;
}

// Função para formatar tempo parado em texto legível
export function formatarTempoParado(ms: number): string {
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (dias > 0) {
    return `${dias} dia${dias > 1 ? 's' : ''} ${horas > 0 ? `e ${horas} hora${horas > 1 ? 's' : ''}` : ''}`;
  }
  return `${horas} hora${horas > 1 ? 's' : ''}`;
}
