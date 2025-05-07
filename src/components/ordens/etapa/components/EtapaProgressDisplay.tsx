
import { Progress } from "@/components/ui/progress";
import { Servico } from "@/types/ordens";
import { useEffect, useState } from "react";

interface EtapaProgressDisplayProps {
  servicos: Servico[];
  onAllServicosConcluidos?: () => void;
}

export default function EtapaProgressDisplay({
  servicos,
  onAllServicosConcluidos
}: EtapaProgressDisplayProps) {
  const [progresso, setProgresso] = useState(0);
  
  useEffect(() => {
    if (servicos.length === 0) return;
    
    // CORRIGIDO: Apenas considerar os serviços concluídos, ignorando atribuição de funcionários
    const servicosConcluidos = servicos.filter(servico => servico.concluido).length;
    const percentualProgresso = Math.round((servicosConcluidos / servicos.length) * 100);
    setProgresso(percentualProgresso);
    
    // Notificar quando todos os serviços estiverem concluídos
    if (servicosConcluidos === servicos.length && onAllServicosConcluidos) {
      onAllServicosConcluidos();
    }
  }, [servicos, onAllServicosConcluidos]);
  
  if (servicos.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <Progress value={progresso} className="h-2" />
    </div>
  );
}
