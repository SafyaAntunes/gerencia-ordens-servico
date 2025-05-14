
import { OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";

/**
 * Verifica se uma subatividade já existe em um serviço
 */
export const subatividadeExisteEmServico = (
  servico: { subatividades?: SubAtividade[] },
  subatividadeId: string
): boolean => {
  if (!servico.subatividades || servico.subatividades.length === 0) {
    return false;
  }
  
  return servico.subatividades.some(sub => sub.id === subatividadeId);
};

/**
 * Atualiza o estado da ordem no componente local após adicionar/modificar subatividades
 */
export const atualizarOrdemNoEstado = (
  ordem: OrdemServico,
  servicoTipo: TipoServico,
  subatividades: SubAtividade[]
): OrdemServico => {
  // Cria uma cópia profunda da ordem para evitar mutações no estado
  const ordemAtualizada = JSON.parse(JSON.stringify(ordem)) as OrdemServico;
  
  // Encontra o serviço a ser atualizado
  const servicoIndex = ordemAtualizada.servicos.findIndex(s => s.tipo === servicoTipo);
  
  if (servicoIndex >= 0) {
    // Atualiza as subatividades do serviço
    ordemAtualizada.servicos[servicoIndex].subatividades = subatividades;
  }
  
  return ordemAtualizada;
};

/**
 * Filtra subatividades para mostrar apenas as selecionadas.
 * Se nenhuma estiver selecionada, mostra todas as subatividades para facilitar a seleção.
 */
export const filtrarSubatividadesSelecionadas = (subatividades?: SubAtividade[]): SubAtividade[] => {
  if (!subatividades) return [];
  
  // Verificar se existem subatividades selecionadas
  const existemSelecionadas = subatividades.some(sub => sub.selecionada);
  
  // Se nenhuma estiver selecionada, retornar todas para permitir seleção
  if (!existemSelecionadas) {
    console.log("Nenhuma subatividade selecionada, exibindo todas:", subatividades.length);
    return subatividades;
  }
  
  // Caso contrário, filtrar apenas as selecionadas
  const filtradas = subatividades.filter(sub => sub.selecionada);
  console.log(`Filtrando subatividades: ${filtradas.length} de ${subatividades.length} selecionadas`);
  return filtradas;
};

/**
 * Marcar uma subatividade como selecionada
 */
export const marcarSubatividadeSelecionada = (
  subatividades: SubAtividade[],
  subatividadeId: string,
  selecionada: boolean = true
): SubAtividade[] => {
  return subatividades.map(sub => {
    if (sub.id === subatividadeId) {
      return { ...sub, selecionada };
    }
    return sub;
  });
};
