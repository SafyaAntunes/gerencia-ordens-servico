
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
    
    // Calculate progress based on service status
    let totalPoints = 0;
    const totalServicos = servicos.length;
    
    servicos.forEach(servico => {
      if (servico.concluido) {
        // Concluído: 100%
        totalPoints += 100;
      } else {
        // Verificar se está em andamento
        const emAndamento = isServicoEmAndamento(servico);
        if (emAndamento) {
          // Em Andamento: 50%
          totalPoints += 50;
        }
        // Não Iniciado: 0% (não adiciona nada)
        // Pausado: Não mexe em nada (mantém o valor atual)
      }
    });
    
    const percentualProgresso = Math.round(totalPoints / totalServicos);
    setProgresso(percentualProgresso);
    
    // Notify when all services are completed
    const servicosConcluidos = servicos.filter(servico => servico.concluido).length;
    if (servicosConcluidos === servicos.length && onAllServicosConcluidos) {
      onAllServicosConcluidos();
    }
  }, [servicos, onAllServicosConcluidos]);

  // Verificar se um serviço está em andamento
  const isServicoEmAndamento = (servico: any): boolean => {
    // Se o serviço estiver concluído, não está em andamento
    if (servico.concluido) return false;
    
    // Verificar se tem funcionário atribuído
    if (servico.funcionarioId) return true;
    
    // Verificar se tem data de início
    if (servico.dataInicio) return true;
    
    return false;
  };
  
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
