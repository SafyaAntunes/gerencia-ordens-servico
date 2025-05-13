
import { Servico, SubAtividade } from "@/types/ordens";
import { toast } from "sonner";

export function useEtapaSubatividades() {
  const verificarSubatividadesConcluidas = (servicos?: Servico[]): boolean => {
    if (!servicos || servicos.length === 0) return true;
    
    for (const servico of servicos) {
      // Only check subactivities that are selected
      const subatividades = servico.subatividades?.filter(s => s.selecionada) || [];
      if (subatividades.length > 0 && !subatividades.every(sub => sub.concluida)) {
        toast.error("É necessário concluir todas as subatividades selecionadas antes de finalizar a etapa");
        return false;
      }
    }
    
    return true;
  };

  const todasSubatividadesConcluidas = (servicos?: Servico[]): boolean => {
    if (!servicos || servicos.length === 0) return true;
    
    return servicos.every(servico => {
      // Only check subactivities that are selected
      const subatividades = servico.subatividades?.filter(s => s.selecionada) || [];
      return subatividades.length === 0 || subatividades.every(sub => sub.concluida);
    });
  };
  
  // New function to merge existing subactivities with new ones, preserving status
  const mergeSubatividades = (existing: SubAtividade[], incoming: SubAtividade[]): SubAtividade[] => {
    const result: SubAtividade[] = [];
    
    // First add all existing subactivities, preserving their state
    existing.forEach(existingSub => {
      result.push({...existingSub});
    });
    
    // Then add any new subactivities that don't exist in the current list
    incoming.forEach(incomingSub => {
      const existingIndex = result.findIndex(sub => sub.id === incomingSub.id);
      if (existingIndex === -1) {
        // This is a new subactivity, add it
        result.push({...incomingSub, selecionada: false, concluida: false});
      }
    });
    
    return result;
  };
  
  return {
    verificarSubatividadesConcluidas,
    todasSubatividadesConcluidas,
    mergeSubatividades
  };
}
