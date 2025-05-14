
import { EtapaOS, TipoServico } from "@/types/ordens";

export const etapaNomes: Record<EtapaOS, string> = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

// Adicionando o export para etapaNomeFormatado que está faltando
export const etapaNomeFormatado: Record<EtapaOS, string> = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

// Adicionando o export para tipoServicoLabel que está faltando
export const tipoServicoLabel: Record<TipoServico, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  inspecao_final: "Inspeção Final"
};
