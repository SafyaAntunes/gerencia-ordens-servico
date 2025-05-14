
import { useState, useCallback } from 'react';
import { SubAtividade } from '@/types/ordens';

export const useTrackingSubatividades = () => {
  const [subatividades, setSubatividades] = useState<Record<string, SubAtividade[]>>({});

  // Preparar subatividades para edição com status preservado
  const prepareSubatividadesForEdit = useCallback(() => {
    return subatividades;
  }, [subatividades]);

  // Atualizar estado de seleção de uma subatividade
  const onSubatividadeToggle = useCallback((servicoTipo: string, subId: string, checked: boolean) => {
    setSubatividades(prev => {
      const tipoSubatividades = prev[servicoTipo] || [];
      
      return {
        ...prev,
        [servicoTipo]: tipoSubatividades.map(sub => 
          sub.id === subId ? { ...sub, selecionada: checked } : sub
        )
      };
    });
  }, []);

  // Adicionar função para logging de estado de subatividades
  const logSubatividadesState = useCallback((source: string, servicoTipo?: string) => {
    if (servicoTipo) {
      console.log(`[${source}] Estado de subatividades para ${servicoTipo}:`, 
        subatividades[servicoTipo]?.map(sub => ({
          id: sub.id,
          nome: sub.nome,
          selecionada: sub.selecionada
        })) || 'Nenhuma subatividade'
      );
    } else {
      console.log(`[${source}] Estado geral de subatividades:`, 
        Object.entries(subatividades).map(([tipo, subs]) => ({
          tipo,
          quantidade: subs.length,
          selecionadas: subs.filter(s => s.selecionada).length
        }))
      );
    }
  }, [subatividades]);

  return {
    subatividades,
    setSubatividades,
    prepareSubatividadesForEdit,
    onSubatividadeToggle,
    logSubatividadesState
  };
};
