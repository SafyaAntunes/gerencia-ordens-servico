
import { useState, useEffect, useCallback } from 'react';
import { getAllSubatividades } from '@/services/subatividadeService';
import { SubAtividade, TipoServico } from '@/types/ordens';
import { isEqual } from 'lodash';

interface UseSubatividadesLoaderProps {
  defaultValues?: Record<string, SubAtividade[]>;
  onLoad?: (tipoServico: TipoServico, subatividades: SubAtividade[]) => void;
  shouldAutoLoad?: boolean;
}

/**
 * Hook para carregar subatividades de serviços com controle de inicialização e modificação
 */
export function useSubatividadesLoader({
  defaultValues = {},
  onLoad,
  shouldAutoLoad = true
}: UseSubatividadesLoaderProps) {
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [loadedSubatividades, setLoadedSubatividades] = useState<Record<string, SubAtividade[]>>(defaultValues);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubatividades = useCallback(async (tipoServico: TipoServico, forceReload = false) => {
    // Verificar se já temos dados carregados para este tipo e não precisamos forçar recarga
    const jaPossuiDados = tipoServico in loadedSubatividades && loadedSubatividades[tipoServico].length > 0;
    
    if (jaPossuiDados && !forceReload) {
      console.log(`[useSubatividadesLoader] Usando subatividades em cache para ${tipoServico}`);
      if (onLoad) {
        onLoad(tipoServico, loadedSubatividades[tipoServico]);
      }
      return loadedSubatividades[tipoServico];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useSubatividadesLoader] Buscando subatividades para ${tipoServico}`);
      const resultado = await getAllSubatividades();
      
      // CORREÇÃO: Garantir que todas as subatividades tenham selecionada=false por padrão
      const subatividadesComDefault = resultado.map(sub => ({
        ...sub,
        selecionada: false // Todas começam não selecionadas por padrão, alterado de true para false
      }));
      
      console.log(`[useSubatividadesLoader] Obtidas ${subatividadesComDefault.length} subatividades para ${tipoServico}`);
      
      // Atualizar o estado apenas se houver mudanças
      setLoadedSubatividades(prevState => {
        const novoEstado = {
          ...prevState,
          [tipoServico]: subatividadesComDefault
        };
        
        // Verificar se há diferenças antes de causar re-render
        if (isEqual(prevState[tipoServico], subatividadesComDefault)) {
          return prevState;
        }
        
        return novoEstado;
      });

      if (onLoad) {
        onLoad(tipoServico, subatividadesComDefault);
      }

      return subatividadesComDefault;
    } catch (err) {
      console.error(`[useSubatividadesLoader] Erro ao carregar subatividades para ${tipoServico}:`, err);
      setError(`Falha ao carregar subatividades para ${tipoServico}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [loadedSubatividades, onLoad]);

  // Marcar como inicializado após a primeira renderização
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      console.log('[useSubatividadesLoader] Hook inicializado');
    }
  }, [hasInitialized]);

  return {
    hasInitialized,
    loadSubatividades,
    loadedSubatividades,
    isLoading,
    error
  };
}
