
import { OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";
import { v4 as uuidv4 } from "uuid";

/**
 * Verifica se uma subatividade já existe no serviço pelo ID
 */
export const subatividadeExiste = (servico: any, subatividadeId: string): boolean => {
  if (!servico || !servico.subatividades) return false;
  return servico.subatividades.some((sub: any) => sub.id === subatividadeId);
};

/**
 * Gera uma nova subatividade com valores padrão
 */
export const criarSubatividade = (
  nome: string,
  servicoTipo: TipoServico,
  tempoEstimado: number = 1
): SubAtividade => {
  return {
    id: uuidv4(),
    nome,
    selecionada: true,
    concluida: false,
    tempoEstimado,
    servicoTipo
  };
};

/**
 * Atualiza as subatividades de um serviço específico na ordem
 */
export const atualizarSubatividadesServico = (
  ordem: OrdemServico,
  servicoTipo: TipoServico,
  novasSubatividades: SubAtividade[]
): OrdemServico => {
  // Clone a ordem para não modificar o objeto original
  const ordemAtualizada = { ...ordem };
  
  // Verifica se a ordem tem serviços
  if (!ordemAtualizada.servicos) {
    ordemAtualizada.servicos = [];
  }
  
  // Encontra o índice do serviço a ser atualizado
  const servicoIndex = ordemAtualizada.servicos.findIndex(s => s.tipo === servicoTipo);
  
  if (servicoIndex >= 0) {
    // Clone o serviço para não modificar o objeto original
    const servicoAtualizado = { ...ordemAtualizada.servicos[servicoIndex] };
    
    // Atualiza as subatividades
    servicoAtualizado.subatividades = novasSubatividades;
    
    // Substitui o serviço na lista
    ordemAtualizada.servicos[servicoIndex] = servicoAtualizado;
  }
  
  return ordemAtualizada;
};

/**
 * Calcula o progresso total de subatividades concluídas em um serviço
 */
export const calcularProgressoSubatividades = (servico: any): number => {
  if (!servico || !servico.subatividades || servico.subatividades.length === 0) {
    return 0;
  }
  
  const subatividadesSelecionadas = servico.subatividades.filter((sub: any) => sub.selecionada);
  
  if (subatividadesSelecionadas.length === 0) {
    return 0;
  }
  
  const concluidas = subatividadesSelecionadas.filter((sub: any) => sub.concluida).length;
  const total = subatividadesSelecionadas.length;
  
  return Math.round((concluidas / total) * 100);
};
