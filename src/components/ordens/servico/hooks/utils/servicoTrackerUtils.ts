
import { ServicoStatus, ServicoStatusType } from "../types/servicoTrackerTypes";
import { TipoServico } from "@/types/ordens";

/**
 * Converte o tipo de serviço para um nome mais amigável
 */
export const getTipoServicoNome = (tipo: TipoServico): string => {
  const nomes: Record<TipoServico, string> = {
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
  
  return nomes[tipo] || tipo;
};

/**
 * Converte o status do serviço para um nome mais amigável
 */
export const getServicoStatusNome = (status: ServicoStatusType): string => {
  const nomes: Record<ServicoStatusType, string> = {
    nao_iniciado: "Não iniciado",
    em_andamento: "Em andamento",
    concluido: "Concluído",
    pausado: "Pausado"
  };
  
  return nomes[status] || status;
};
