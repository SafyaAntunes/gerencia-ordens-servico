
import { toast } from "sonner";

export function useEtapaSubatividades() {
  const todasSubatividadesConcluidas = (servicos: any[] = []) => {
    if (servicos.length === 0) return true;
    
    return servicos.every(servico => {
      const subatividades = servico.subatividades?.filter((s: any) => s.selecionada) || [];
      return subatividades.length === 0 || subatividades.every((sub: any) => sub.concluida);
    });
  };
  
  const verificarSubatividadesConcluidas = (servicos: any[] = []) => {
    if (!todasSubatividadesConcluidas(servicos)) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return false;
    }
    return true;
  };
  
  return {
    todasSubatividadesConcluidas,
    verificarSubatividadesConcluidas
  };
}
