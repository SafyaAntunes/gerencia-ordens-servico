
import { OrdemServico } from "@/types/ordens";

// Keys para localStorage
export const STORAGE_KEYS = {
  ORDENS: "sgr-ordens",
  AUTH: "sgr-auth",
  FUNCIONARIOS: "sgr-funcionarios",
  CLIENTES: "sgr-clientes"
};

// Função para carregar ordens de serviço
export const loadOrdens = (): OrdemServico[] => {
  try {
    const ordensString = localStorage.getItem(STORAGE_KEYS.ORDENS);
    if (!ordensString) return [];
    
    return JSON.parse(ordensString, (key, value) => {
      if (key === "dataAbertura" || key === "dataPrevistaEntrega" || 
          key === "iniciado" || key === "finalizado" || 
          key === "inicio" || key === "fim") {
        return value ? new Date(value) : null;
      }
      return value;
    });
  } catch (error) {
    console.error("Erro ao carregar ordens:", error);
    return [];
  }
};

// Função para salvar ordens de serviço
export const saveOrdens = (ordens: OrdemServico[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(ordens));
  } catch (error) {
    console.error("Erro ao salvar ordens:", error);
  }
};

// Função para obter uma ordem específica por ID
export const getOrdemById = (id: string): OrdemServico | null => {
  const ordens = loadOrdens();
  return ordens.find(ordem => ordem.id === id) || null;
};

// Função para atualizar uma ordem específica
export const updateOrdem = (ordemAtualizada: OrdemServico): boolean => {
  try {
    const ordens = loadOrdens();
    const index = ordens.findIndex(ordem => ordem.id === ordemAtualizada.id);
    
    if (index === -1) return false;
    
    ordens[index] = ordemAtualizada;
    saveOrdens(ordens);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar ordem:", error);
    return false;
  }
};

// Função para excluir uma ordem
export const deleteOrdem = (id: string): boolean => {
  try {
    const ordens = loadOrdens();
    const ordensAtualizadas = ordens.filter(ordem => ordem.id !== id);
    
    if (ordensAtualizadas.length === ordens.length) return false;
    
    saveOrdens(ordensAtualizadas);
    return true;
  } catch (error) {
    console.error("Erro ao excluir ordem:", error);
    return false;
  }
};

// Função para contar ordens por status
export const countOrdensByStatus = (): Record<string, number> => {
  const ordens = loadOrdens();
  
  return ordens.reduce((acc: Record<string, number>, ordem) => {
    acc[ordem.status] = (acc[ordem.status] || 0) + 1;
    return acc;
  }, {});
};

// Função para contar ordens por prioridade
export const countOrdensByPriority = (): Record<string, number> => {
  const ordens = loadOrdens();
  
  return ordens.reduce((acc: Record<string, number>, ordem) => {
    acc[ordem.prioridade] = (acc[ordem.prioridade] || 0) + 1;
    return acc;
  }, {});
};
