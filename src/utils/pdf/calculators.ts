
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { PDFProgressoData, PDFTempoData } from "./types";

// Calcular dados de progresso para PDF
export const calcularProgressos = (ordem: OrdemServico): PDFProgressoData => {
  // Progresso por etapa
  const progressoEtapas: Record<string, number> = {};
  let totalEtapas = 0;
  let completedEtapas = 0;
  
  Object.entries(ordem.etapasAndamento || {}).forEach(([etapa, dados]) => {
    const etapaBase = etapa.split('_')[0] as EtapaOS;
    const progresso = dados.concluido ? 100 : 0;
    progressoEtapas[etapaBase] = progresso;
    
    totalEtapas++;
    if (dados.concluido) completedEtapas++;
  });
  
  // Progresso por serviço
  const progressoServicos: Record<string, number> = {};
  ordem.servicos.forEach(servico => {
    let progresso = 0;
    if (servico.subatividades && servico.subatividades.length > 0) {
      const total = servico.subatividades.length;
      const concluidas = servico.subatividades.filter(sub => sub.concluida).length;
      progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    }
    progressoServicos[servico.tipo] = progresso;
  });
  
  // Progresso total
  const progressoTotal = totalEtapas > 0 
    ? Math.round((completedEtapas / totalEtapas) * 100)
    : 0;
    
  return { progressoEtapas, progressoServicos, progressoTotal };
};

// Calcular dados de tempo para PDF
export const calcularTempos = (ordem: OrdemServico): PDFTempoData => {
  const temposPorEtapa: Record<string, number> = {};
  let tempoTotalRegistrado = 0;
  
  // Calcular tempo por etapa - usando tempo estimado já que tempoTotal não existe
  Object.entries(ordem.etapasAndamento || {}).forEach(([etapa, dadosEtapa]) => {
    const etapaBase = etapa.split('_')[0] as EtapaOS;
    // Use tempoEstimado em vez de tempoTotal que não existe
    const tempoEtapa = dadosEtapa.tempoEstimado ? dadosEtapa.tempoEstimado * 60 * 60 * 1000 : 0;
    
    temposPorEtapa[etapaBase] = (temposPorEtapa[etapaBase] || 0) + tempoEtapa;
    tempoTotalRegistrado += tempoEtapa;
  });
  
  // Calcular tempo estimado total
  let tempoEstimado = ordem.tempoTotalEstimado || 0;
  if (tempoEstimado === 0) {
    // Somar tempos estimados de etapas
    Object.entries(ordem.etapasAndamento || {}).forEach(([, dadosEtapa]) => {
      tempoEstimado += dadosEtapa.tempoEstimado || 0;
    });
    
    // Converter para milissegundos
    tempoEstimado *= 60 * 60 * 1000; // horas para ms
  }
  
  // Calcular dias em andamento
  const inicioDate = ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date();
  const agora = new Date();
  const diff = agora.getTime() - inicioDate.getTime();
  const diasEmAndamento = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return { temposPorEtapa, tempoTotalRegistrado, tempoEstimado, diasEmAndamento };
};
