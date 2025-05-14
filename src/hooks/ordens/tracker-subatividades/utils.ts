
import { OrdemServico, SubAtividade, TipoServico } from "@/types/ordens";

/**
 * Atualiza a ordem no estado com as novas informações
 */
export const atualizarOrdemNoEstado = (
  ordem: OrdemServico,
  servicoTipo: TipoServico,
  novasSubatividades: SubAtividade[]
): OrdemServico => {
  if (!ordem) return ordem;

  // Clone a ordem para não modificar o objeto original
  const novaOrdem = { ...ordem };
  
  // Encontre o serviço a ser atualizado
  const servicoIndex = novaOrdem.servicos.findIndex(s => s.tipo === servicoTipo);
  
  if (servicoIndex === -1) return ordem; // Serviço não encontrado
  
  // Atualize as subatividades no serviço
  novaOrdem.servicos[servicoIndex] = {
    ...novaOrdem.servicos[servicoIndex],
    subatividades: novasSubatividades
  };
  
  return novaOrdem;
};

/**
 * Filtra as subatividades para mostrar apenas as selecionadas
 * Se nenhuma estiver selecionada, retorna todas
 */
export const filtrarSubatividadesSelecionadas = (
  subatividades: SubAtividade[] | undefined
): SubAtividade[] => {
  if (!subatividades || subatividades.length === 0) {
    return [];
  }
  
  // Verificar se há pelo menos uma subatividade selecionada
  const temSubatividadesSelecionadas = subatividades.some(sub => sub.selecionada);
  
  // Se não houver nenhuma selecionada, retornar todas para exibição
  if (!temSubatividadesSelecionadas) {
    console.log("Nenhuma subatividade selecionada, exibindo todas para seleção");
    return subatividades;
  }
  
  // Caso contrário, filtrar apenas as selecionadas
  const selecionadas = subatividades.filter(sub => sub.selecionada);
  console.log(`Filtrando subatividades: ${selecionadas.length} de ${subatividades.length} selecionadas`);
  return selecionadas;
};
