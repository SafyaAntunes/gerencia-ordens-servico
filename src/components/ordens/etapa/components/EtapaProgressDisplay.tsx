
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
    
    // Calculate progress based on completed services (concluido: true)
    const servicosConcluidos = servicos.filter(servico => servico.concluido).length;
    const percentualProgresso = Math.round((servicosConcluidos / servicos.length) * 100);
    setProgresso(percentualProgresso);
    
    // Notify when all services are completed
    if (servicosConcluidos === servicos.length && onAllServicosConcluidos) {
      onAllServicosConcluidos();
    }
  }, [servicos, onAllServicosConcluidos]);
  
  if (servicos.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span>Progresso da Etapa</span>
        <span>{progresso}%</span>
      </div>
      <Progress value={progresso} className="h-2" />
    </div>
  );
}
