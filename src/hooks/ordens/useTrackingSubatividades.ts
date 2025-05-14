
import { SubAtividade } from "@/types/ordens";
import { useState, useCallback } from "react";

export const useTrackingSubatividades = () => {
  const [subatividadesLog, setSubatividadesLog] = useState<Record<string, any[]>>({});
  
  const logSubatividadesState = useCallback((
    context: string,
    tipoServico: string,
    subatividades?: SubAtividade[]
  ) => {
    if (!subatividades) {
      console.log(`[${context}] ${tipoServico}: Nenhuma subatividade`);
      return;
    }

    const stats = {
      total: subatividades.length,
      selecionadas: subatividades.filter(s => s.selecionada === true).length,
      naoSelecionadas: subatividades.filter(s => s.selecionada === false).length,
      indefinidas: subatividades.filter(s => s.selecionada === undefined).length,
      concluidas: subatividades.filter(s => s.concluida).length
    };

    console.log(`[${context}] ${tipoServico} tem ${subatividades.length} subatividades:`);
    console.log(`[${context}] Estatísticas para ${tipoServico}:`, stats);
    
    setSubatividadesLog(prev => ({
      ...prev,
      [tipoServico]: [...(prev[tipoServico] || []), { context, stats, timestamp: new Date() }]
    }));
  }, []);
  
  return { logSubatividadesState, subatividadesLog };
};
