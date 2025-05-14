
import { SubAtividade, TipoServico, EtapaOS } from "@/types/ordens";

/**
 * Filtra as subatividades para mostrar apenas as selecionadas
 */
export const filtrarSubatividadesSelecionadas = (subatividades?: SubAtividade[]): SubAtividade[] => {
  if (!subatividades || subatividades.length === 0) return [];
  return subatividades.filter(sub => sub.selecionada);
};

/**
 * Gera uma chave consistente para etapas, especialmente para inspeção inicial/final
 * que precisam do tipo do serviço como parte da chave
 */
export const gerarEtapaKey = (etapa: EtapaOS, servicoTipo?: TipoServico | null): string => {
  // Para inspeções e lavagem, a chave inclui o tipo de serviço se fornecido
  if (["inspecao_inicial", "inspecao_final", "lavagem"].includes(etapa) && servicoTipo) {
    return `${etapa}_${servicoTipo}`;
  }
  return etapa;
};

/**
 * Verifica se uma etapa está concluída baseado nos dados de etapasAndamento
 */
export const verificarEtapaConcluida = (
  etapasAndamento: any, 
  etapa: EtapaOS, 
  servicoTipo?: TipoServico | null
): boolean => {
  if (!etapasAndamento) return false;
  
  const etapaKey = gerarEtapaKey(etapa, servicoTipo);
  
  // Log para debug
  console.log(`Verificando conclusão da etapa: ${etapaKey}`, etapasAndamento[etapaKey]);
  
  // Verifica se a etapa existe e está concluída
  return Boolean(etapasAndamento[etapaKey]?.concluido);
};

/**
 * Obtém o status da etapa com base nos dados de etapasAndamento
 */
export const obterEtapaStatus = (
  etapasAndamento: any,
  etapa: EtapaOS,
  servicoTipo?: TipoServico | null
): 'concluido' | 'em_andamento' | 'nao_iniciado' => {
  if (!etapasAndamento) return 'nao_iniciado';
  
  const etapaKey = gerarEtapaKey(etapa, servicoTipo);
  const etapaInfo = etapasAndamento[etapaKey];
  
  if (!etapaInfo) return 'nao_iniciado';
  
  if (etapaInfo.concluido === true) {
    return 'concluido';
  } else if (etapaInfo.iniciado) {
    return 'em_andamento';
  } else {
    return 'nao_iniciado';
  }
};
