
import { Servico } from "@/types/ordens";
import { toast } from "sonner";

export function useEtapaSubatividades() {
  const verificarSubatividadesConcluidas = (servicos?: Servico[]): boolean => {
    if (!servicos || servicos.length === 0) return true;
    
    for (const servico of servicos) {
      const subatividades = servico.subatividades?.filter(s => s.selecionada) || [];
      if (subatividades.length > 0 && !subatividades.every(sub => sub.concluida)) {
        toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
        return false;
      }
    }
    
    return true;
  };

  const todasSubatividadesConcluidas = (servicos?: Servico[]): boolean => {
    if (!servicos || servicos.length === 0) return true;
    
    return servicos.every(servico => {
      const subatividades = servico.subatividades?.filter(s => s.selecionada) || [];
      return subatividades.length === 0 || subatividades.every(sub => sub.concluida);
    });
  };
  
  return {
    verificarSubatividadesConcluidas,
    todasSubatividadesConcluidas
  };
}
