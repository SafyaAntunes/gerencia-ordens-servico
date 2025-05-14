
import { SubAtividade } from "@/types/ordens";
import { useState } from "react";

export const useServicosDebug = () => {
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  // Add debugInfoLoaded state required by other components
  const [debugInfoLoaded, setDebugInfoLoaded] = useState(false);

  const logSubatividades = (context: string, tipoServico: string, subatividades?: SubAtividade[]) => {
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

    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      tipoServico,
      stats,
      subatividades: subatividades.map(s => ({
        id: s.id,
        nome: s.nome,
        selecionada: s.selecionada,
        concluida: s.concluida
      }))
    };

    setDebugLogs(prev => [...prev, logEntry]);
    
    console.log(`[${context}] ${tipoServico} tem ${subatividades.length} subatividades:`);
    console.log(`[${context}] Detalhes:`, subatividades.map(s => ({
      id: s.id, 
      nome: s.nome, 
      selecionada: s.selecionada !== undefined ? s.selecionada : 'undefined',
      concluida: s.concluida
    })));
    console.log(`[${context}] Estatísticas para ${tipoServico}:`, stats);
  };

  return {
    logSubatividades,
    debugLogs,
    debugInfoLoaded,
    setDebugInfoLoaded
  };
};
