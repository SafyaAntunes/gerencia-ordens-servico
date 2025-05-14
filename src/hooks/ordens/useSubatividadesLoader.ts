import { useState, useEffect } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { toast } from "sonner";

interface UseSubatividadesLoaderProps {
  defaultValues?: any;
  defaultSubatividades?: Record<TipoServico, string[]>;
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
    if (hasInitialized) return;
    
    console.log("⚠️ [useSubatividadesLoader] Verificando valores de inicialização do defaultValues...");
    
    if (defaultValues?.servicosSubatividades) {
      console.log("📝 [useSubatividadesLoader] Inicializando com subatividades do defaultValues:", defaultValues.servicosSubatividades);
      console.log("📝 [useSubatividadesLoader] Detalhes por tipo: ");
      
      // Log details by type
      Object.entries(defaultValues.servicosSubatividades).forEach(([tipo, subs]) => {
        console.log(`📝 [useSubatividadesLoader] ${tipo}: ${subs.length} subatividades`);
        if (subs.length > 0) {
          console.log(`📝 [useSubatividadesLoader] Primeira subatividade de ${tipo}:`, subs[0]);
        }
      });
    } else {
      console.log("⚠️ [useSubatividadesLoader] Nenhum valor de subatividades no defaultValues");
    }
    
    setHasInitialized(true);
  }, [defaultValues?.servicosSubatividades, hasInitialized]);

  // Actual loading function with proper priority handling
  const loadSubatividades = async (
    tipo: TipoServico, 
    servicosSubatividades: Record<string, SubAtividade[]>,
    pendingOperations: Record<string, boolean>,
    sourceTracker: Record<string, string>
  ) => {
    // Skip if already loading this type
    if (pendingOperations[tipo]) {
      console.log(`⏭️ [loadSubatividades] Já está carregando subatividades para ${tipo}, pulando...`);
      return null;
    }
    
    // HIGHEST PRIORITY: Use saved subatividades from editing mode if available
    if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
      console.log(`✅ [loadSubatividades] PRIORIDADE MÁXIMA: Usando subatividades SALVAS da ordem para ${tipo}`, 
        defaultValues.servicosSubatividades[tipo]);
      
      // Ensure all subatividades have the correct states
      const savedSubatividades = defaultValues.servicosSubatividades[tipo].map(sub => ({
        ...sub,
        // Preserve the 'selected' state or set as true if it doesn't exist
        selecionada: sub.selecionada !== undefined ? sub.selecionada : true,
        // Preserve the 'completed' state or set as false if it doesn't exist
        concluida: sub.concluida ?? false
      }));
      
      sourceTracker[tipo] = "edição";
      trackSource(tipo, "edição");
      return savedSubatividades;
    }
    
    // Mark as pending to avoid duplicate loads
    pendingOperations[tipo] = true;
    
    try {
      // HIGH PRIORITY: Use existing subatividades in local state
      const existingSubatividades = servicosSubatividades[tipo] || [];
      if (existingSubatividades.length > 0) {
        console.log(`✅ [loadSubatividades] PRIORIDADE ALTA: USANDO SUBATIVIDADES EXISTENTES para ${tipo}:`, existingSubatividades);
        sourceTracker[tipo] = "existente";
        trackSource(tipo, "existente");
        return null;
      }
      
      // MEDIUM PRIORITY: Fetch subatividades from database
      console.log(`🔍 [loadSubatividades] PRIORIDADE MÉDIA: Buscando subatividades do banco para ${tipo}...`);
      const dbSubatividades = await getSubatividadesByTipo(tipo);
      console.log(`🔍 [loadSubatividades] Recebidas do banco para ${tipo}:`, dbSubatividades?.length || 0);
      
      if (dbSubatividades && dbSubatividades.length > 0) {
        const formattedSubs = dbSubatividades.map(sub => ({
          ...sub,
          selecionada: true,
          concluida: false
        }));
        
        console.log(`✅ [loadSubatividades] USANDO SUBATIVIDADES DO BANCO para ${tipo}:`, formattedSubs);
        sourceTracker[tipo] = "banco";
        trackSource(tipo, "banco");
        return formattedSubs;
      }
      
      // LOW PRIORITY: Use default values only as last resort
      if (defaultSubatividades && defaultSubatividades[tipo]) {
        const defaultSubs = defaultSubatividades[tipo].map(nome => ({
          id: nome,
          nome: nome,
          selecionada: true,
          concluida: false
        }));
        
        console.log(`⚠️ [loadSubatividades] PRIORIDADE BAIXA: USANDO SUBATIVIDADES BÁSICAS (fallback) para ${tipo}:`, defaultSubs);
        toast.warning(`Subatividades de configuração não encontradas para ${tipo}. Usando valores básicos.`);
        
        sourceTracker[tipo] = "padrão";
        trackSource(tipo, "padrão");
        return defaultSubs;
      } else {
        console.log(`❌ [loadSubatividades] Nenhuma subatividade disponível para ${tipo}`);
        sourceTracker[tipo] = "vazio";
        trackSource(tipo, "vazio");
        return [];
      }
      
    } catch (error) {
      console.error(`❌ [loadSubatividades] Erro ao carregar subatividades para ${tipo}:`, error);
      toast.error(`Erro ao carregar subatividades para ${tipo}`);
      
      // If we have values from edit mode, use them despite the error
      if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
        console.log(`🔄 [loadSubatividades] Apesar do erro, usando subatividades do modo de edição para ${tipo}`);
        sourceTracker[tipo] = "edição (recuperação de erro)";
        trackSource(tipo, "edição (recuperação de erro)");
        return defaultValues.servicosSubatividades![tipo];
      } 
      // Otherwise use defaults as last resort
      else if (defaultSubatividades && defaultSubatividades[tipo]) {
        console.log(`🔄 [loadSubatividades] Usando básicos como último recurso para ${tipo}`);
        const defaultSubs = defaultSubatividades[tipo].map(nome => ({
          id: nome,
          nome,
          selecionada: true,
          concluida: false,
        }));
        
        sourceTracker[tipo] = "padrão (recuperação de erro)";
        trackSource(tipo, "padrão (recuperação de erro)");
        return defaultSubs;
      } else {
        sourceTracker[tipo] = "vazio (erro)";
        trackSource(tipo, "vazio (erro)");
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
