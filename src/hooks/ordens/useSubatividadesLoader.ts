
import { useState, useEffect } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { toast } from "sonner";
import { FormValues } from '@/components/ordens/form/types';

interface UseSubatividadesLoaderProps {
  defaultValues?: Partial<FormValues>;
  defaultSubatividades: Record<string, string[]>;
  trackSource: (tipo: TipoServico, source: string) => void;
}

/**
 * Hook for loading subatividades from different sources with proper priority
 */
export const useSubatividadesLoader = ({
  defaultValues,
  defaultSubatividades,
  trackSource
}: UseSubatividadesLoaderProps) => {
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize from defaultValues when available
  useEffect(() => {
    if (!hasInitialized && defaultValues) {
      console.log('🔄 [useSubatividadesLoader] Inicializando...');
      setHasInitialized(true);
    }
  }, [defaultValues, hasInitialized]);

  // Actual loading function with proper priority handling
  const loadSubatividades = async (
    tipo: TipoServico, 
    currentSubatividades: Record<string, SubAtividade[]>,
    pendingOperations: Record<string, boolean>,
    sourceTracker: Record<string, string>
  ) => {
    // Skip if already loading this type
    if (pendingOperations[tipo]) {
      console.log(`⏭️ [loadSubatividades] Já está carregando subatividades para ${tipo}, pulando...`);
      return null;
    }
    
    // HIGHEST PRIORITY: If we have saved subatividades from edit mode, use those
    // IMPORTANTE: Na edição, precisamos obter TODAS as subatividades disponíveis
    if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
      console.log(
        `✅ [loadSubatividades] PRIORIDADE MÁXIMA: Usando subatividades SALVAS da ordem para ${tipo}`,
        defaultValues.servicosSubatividades[tipo]
      );

      // Ensure all subatividades have the correct states
      // CORREÇÃO: Preservar o estado 'selecionada' existente, não forçar como true
      const savedSubatividades = defaultValues.servicosSubatividades[tipo].map((sub) => ({
        ...sub,
        // Preserve the existing 'selecionada' state, don't force it to true
        selecionada: sub.selecionada !== undefined ? sub.selecionada : false,
        // Preserve the 'concluida' state or set as false if it doesn't exist
        concluida: sub.concluida ?? false,
      }));

      sourceTracker[tipo] = 'edição';
      trackSource(tipo, 'edição');
      
      // CORREÇÃO: Buscar todas as subatividades disponíveis e adicionar
      // as que não estão na lista salva como não selecionadas
      try {
        const allDbSubatividades = await getSubatividadesByTipo(tipo);
        if (allDbSubatividades && allDbSubatividades.length > 0) {
          // Mapear IDs existentes para facilitar comparação
          const existingIds = new Set(savedSubatividades.map(s => s.id));
          
          // Adicionar as subatividades do banco que não existem na lista salva
          const additionalSubatividades = allDbSubatividades
            .filter(dbSub => !existingIds.has(dbSub.id))
            .map(dbSub => ({
              ...dbSub,
              selecionada: false, // Novas subatividades vêm desmarcadas
              concluida: false
            }));
          
          if (additionalSubatividades.length > 0) {
            console.log(`✅ [loadSubatividades] Adicionando ${additionalSubatividades.length} novas subatividades do banco para ${tipo}`);
            return [...savedSubatividades, ...additionalSubatividades];
          }
        }
      } catch (error) {
        console.error(`❌ [loadSubatividades] Erro ao buscar subatividades adicionais do banco para ${tipo}:`, error);
      }
      
      return savedSubatividades;
    }
    
    // Mark as pending to avoid duplicate loads
    pendingOperations[tipo] = true;
    
    try {
      // HIGH PRIORITY: Use existing subatividades in the local state
      const existingSubatividades = currentSubatividades[tipo] || [];
      if (existingSubatividades.length > 0) {
        console.log(
          `✅ [loadSubatividades] PRIORIDADE ALTA: USANDO SUBATIVIDADES EXISTENTES para ${tipo}:`,
          existingSubatividades
        );
        sourceTracker[tipo] = 'existente';
        trackSource(tipo, 'existente');
        return existingSubatividades;
      }
      
      // MEDIUM PRIORITY: Fetch subatividades from database
      console.log(`🔍 [loadSubatividades] PRIORIDADE MÉDIA: Buscando subatividades do banco para ${tipo}...`);
      const dbSubatividades = await getSubatividadesByTipo(tipo);
      console.log(`🔍 [loadSubatividades] Recebidas do banco para ${tipo}:`, dbSubatividades?.length || 0);
      
      if (dbSubatividades && dbSubatividades.length > 0) {
        // CORREÇÃO: Definir selecionada como false por padrão
        const formattedSubs = dbSubatividades.map((sub) => ({
          ...sub,
          selecionada: false, // Por padrão, novas subatividades vêm desmarcadas
          concluida: false,
        }));
        
        console.log(`✅ [loadSubatividades] USANDO SUBATIVIDADES DO BANCO para ${tipo}:`, formattedSubs);
        sourceTracker[tipo] = 'banco';
        trackSource(tipo, 'banco');
        return formattedSubs;
      }
      
      // LOW PRIORITY: Use default values only as a last resort
      if (defaultSubatividades && defaultSubatividades[tipo]) {
        // CORREÇÃO: Definir selecionada como false por padrão
        const defaultSubs = defaultSubatividades[tipo].map((nome) => ({
          id: nome,
          nome: nome,
          selecionada: false, // Por padrão, novas subatividades vêm desmarcadas
          concluida: false,
        }));
        
        console.log(
          `⚠️ [loadSubatividades] PRIORIDADE BAIXA: USANDO SUBATIVIDADES BÁSICAS (fallback) para ${tipo}:`,
          defaultSubs
        );
        toast.warning(`Subatividades de configuração não encontradas para ${tipo}. Usando valores básicos.`);
        
        sourceTracker[tipo] = 'padrão';
        trackSource(tipo, 'padrão');
        return defaultSubs;
      } else {
        console.log(`❌ [loadSubatividades] Nenhuma subatividade disponível para ${tipo}`);
        sourceTracker[tipo] = 'vazio';
        trackSource(tipo, 'vazio');
        return [];
      }
      
    } catch (error) {
      console.error(`❌ [loadSubatividades] Erro ao carregar subatividades para ${tipo}:`, error);
      toast.error(`Erro ao carregar subatividades para ${tipo}`);
      
      // If we have values from edit mode, use them despite the error
      if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
        console.log(`🔄 [loadSubatividades] Apesar do erro, usando subatividades do modo de edição para ${tipo}`);
        sourceTracker[tipo] = 'edição (recuperação de erro)';
        trackSource(tipo, 'edição (recuperação de erro)');
        return defaultValues.servicosSubatividades[tipo];
      }
      // Otherwise, use the defaults as a last option
      else if (defaultSubatividades && defaultSubatividades[tipo]) {
        console.log(`🔄 [loadSubatividades] Usando básicos como último recurso para ${tipo}`);
        const defaultSubs = defaultSubatividades[tipo].map((nome) => ({
          id: nome,
          nome,
          selecionada: false, // Alterado para false por padrão
          concluida: false,
        }));
        
        sourceTracker[tipo] = 'padrão (recuperação de erro)';
        trackSource(tipo, 'padrão (recuperação de erro)');
        return defaultSubs;
      } else {
        sourceTracker[tipo] = 'vazio (erro)';
        trackSource(tipo, 'vazio (erro)');
        return [];
      }
    } finally {
      pendingOperations[tipo] = false;
    }
  };

  return {
    hasInitialized,
    loadSubatividades
  };
};
