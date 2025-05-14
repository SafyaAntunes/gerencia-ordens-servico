
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

  return {
    subatividades,
    setSubatividades,
    prepareSubatividadesForEdit,
    onSubatividadeToggle
  };
};
