
// Update line 8 where "fabricacao" is used as a status
// Change it to use "executando_servico" instead

export const getStatusName = (status: string): string => {
  const statusMap: Record<string, string> = {
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    autorizado: "Autorizado", // Added new status
    executando_servico: "Executando Serviço", // Changed from fabricacao
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue"
  };
  
  return statusMap[status] || status;
};

// Add statusLabels export for utils/pdf/sections.ts
export const statusLabels = {
  orcamento: "Orçamento",
  aguardando_aprovacao: "Aguardando Aprovação",
  autorizado: "Autorizado",
  executando_servico: "Executando Serviço", 
  aguardando_peca_cliente: "Aguardando Peça (Cliente)",
  aguardando_peca_interno: "Aguardando Peça (Interno)",
  finalizado: "Finalizado",
  entregue: "Entregue"
};

// Add additional required exports
export const etapasNomes = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

export const formatarTempo = (segundos: number): string => {
  if (isNaN(segundos) || segundos < 0) return "00:00:00";
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);
  
  const formatado = [
    horas.toString().padStart(2, '0'),
    minutos.toString().padStart(2, '0'),
    segs.toString().padStart(2, '0')
  ].join(':');
  
  return formatado;
};

