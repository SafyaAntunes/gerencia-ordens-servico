
import { StatusOS, EtapaOS } from "@/types/ordens";

// Status labels para PDF
export const statusLabels: Record<StatusOS, string> = {
  orcamento: "Orçamento",
  aguardando_aprovacao: "Aguardando Aprovação",
  executando_servico: "Fabricação", // Changed from "fabricacao" to match StatusOS type
  aguardando_peca_cliente: "Aguardando Peça (Cliente)",
  aguardando_peca_interno: "Aguardando Peça (Interno)",
  finalizado: "Finalizado",
  entregue: "Entregue",
  desmontagem: "Desmontagem",
  inspecao_inicial: "Inspeção Inicial",
  autorizado: "Autorizado"
};

// Etapa labels para PDF
export const etapasNomes: Record<string, string> = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

// Formatar tempo para PDF
export const formatarTempo = (ms: number): string => {
  if (!ms) return "0h";
  const horas = Math.floor(ms / (1000 * 60 * 60));
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`;
};
