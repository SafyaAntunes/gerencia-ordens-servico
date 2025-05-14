
import { useState, useEffect } from 'react';
import { SubAtividade } from '@/types/ordens';

/**
 * Hook para rastrear e fazer debug do estado das subatividades
 */
export const useTrackingSubatividades = () => {
  // Função para fazer log do estado das subatividades
  const logSubatividadesState = (servicoTipo: string, subatividades: SubAtividade[]) => {
    console.log(`[useTrackingSubatividades] Estado das subatividades para ${servicoTipo}:`, 
      subatividades.map(sub => ({
        id: sub.id,
        nome: sub.nome,
        selecionada: sub.selecionada,
        concluida: sub.concluida
      }))
    );
  };

  return { logSubatividadesState };
};
