
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
