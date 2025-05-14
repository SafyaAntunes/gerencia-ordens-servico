
import { useState, useEffect } from "react";
import { getAllSubatividades } from "@/services/subatividadeService";

/**
 * Hook for diagnostic functions related to serviços
 */
export const useServicosDebug = () => {
  const [debugInfoLoaded, setDebugInfoLoaded] = useState(false);

  // Load diagnostic information once
  useEffect(() => {
    if (!debugInfoLoaded) {
      const loadDebugInfo = async () => {
        try {
          console.log("🔍 [DIAGNÓSTICO] Carregando todas as subatividades do banco para verificação...");
          const allSubs = await getAllSubatividades();
          console.log("🔍 [DIAGNÓSTICO] Total de subatividades no banco:", allSubs.length);
          console.log("🔍 [DIAGNÓSTICO] Subatividades por tipo:");
          
          // Group by type for better visualization
          const grouped = allSubs.reduce((acc, item) => {
            if (!acc[item.tipoServico]) {
              acc[item.tipoServico] = [];
            }
            acc[item.tipoServico].push(item);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(grouped).forEach(([tipo, items]) => {
            console.log(`   - ${tipo}: ${items.length} itens`);
            if (items.length > 0) {
              console.log(`     - Exemplos: ${items.map(i => i.nome).join(', ').substring(0, 100)}...`);
            }
          });
          
          setDebugInfoLoaded(true);
        } catch (error) {
          console.error("🔍 [DIAGNÓSTICO] Erro ao carregar informações de diagnóstico:", error);
        }
      };
      
      loadDebugInfo();
    }
  }, [debugInfoLoaded]);

  return { debugInfoLoaded };
};
