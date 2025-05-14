
import { SubAtividade, TipoServico, OrdemServico } from '@/types/ordens';
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a new subatividade object with default values
 */
export const createSubatividade = (
  nome: string,
  tempoEstimado: number = 1
): SubAtividade => {
  return {
    id: uuidv4(),
    nome,
    concluida: false,
    selecionada: true,
    tempoEstimado
  };
};

/**
 * Filter servicos based on etapa and servicoTipo
 */
export const filterServicosByEtapa = (
  ordem: OrdemServico,
  etapa: string,
  servicoTipo?: TipoServico
): OrdemServico['servicos'] => {
  if (!ordem.servicos) return [];
  
  return ordem.servicos.filter(s => {
    if (etapa === "inspecao_inicial" || etapa === "inspecao_final") {
      return servicoTipo ? s.tipo === servicoTipo : false;
    }
    if (etapa === "retifica") {
      return ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo);
    }
    return s.tipo === etapa;
  });
};
