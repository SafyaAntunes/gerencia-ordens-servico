
import { useEffect } from 'react';
import { SubAtividade } from '@/types/ordens';

/**
 * Hook para ajudar no debug de problemas com subatividades
 * Este hook vai rastrear e logar informações sobre subatividades em pontos críticos
 */
export function useTrackingSubatividades() {
  /**
   * Função para logar o estado de subatividades
   */
  const logSubatividadesState = (
    context: string, 
    tipo: string,
    subatividades: SubAtividade[] | undefined
  ) => {
    if (!subatividades) {
      console.log(`[${context}] Sem subatividades para ${tipo}`);
      return;
    }
    
    console.log(`[${context}] ${tipo} tem ${subatividades.length} subatividades:`);
    console.log(`[${context}] Detalhes:`, 
      subatividades.map(sub => ({
        id: sub.id,
        nome: sub.nome,
        selecionada: sub.selecionada !== undefined ? sub.selecionada : '(undefined)',
        concluida: sub.concluida
      }))
    );
    
    // Estatísticas
    const stats = {
      total: subatividades.length,
      selecionadas: subatividades.filter(s => s.selecionada === true).length,
      naoSelecionadas: subatividades.filter(s => s.selecionada === false).length,
      indefinidas: subatividades.filter(s => s.selecionada === undefined).length,
      concluidas: subatividades.filter(s => s.concluida).length
    };
    
    console.log(`[${context}] Estatísticas para ${tipo}:`, stats);
  }

  return {
    logSubatividadesState
  };
}
