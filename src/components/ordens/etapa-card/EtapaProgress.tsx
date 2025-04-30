
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Servico } from "@/types/ordens";

interface EtapaProgressProps {
  servicos: Servico[];
}

export default function EtapaProgress({ servicos }: EtapaProgressProps) {
  const [progresso, setProgresso] = useState(0);
  
  useEffect(() => {
    if (servicos.length === 0) return;
    
    const servicosConcluidos = servicos.filter(servico => servico.concluido).length;
    const percentualProgresso = Math.round((servicosConcluidos / servicos.length) * 100);
    setProgresso(percentualProgresso);
  }, [servicos]);
  
  if (servicos.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <Progress value={progresso} className="h-2" />
    </div>
  );
}
